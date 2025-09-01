export const DATABASE_SCHEMA = {
  // Posts table - stores all generated posts
  posts: `
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      bot_id TEXT NOT NULL,
      category TEXT,
      used BOOLEAN DEFAULT FALSE,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      generation_cost REAL,
      generation_tokens INTEGER,
      generation_model TEXT,
      content_hash TEXT UNIQUE,
      CONSTRAINT unique_content_per_bot UNIQUE(bot_id, content_hash)
    )
  `,

  // Bot stats table - tracks bot performance and usage
  bot_stats: `
    CREATE TABLE IF NOT EXISTS bot_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bot_id TEXT UNIQUE NOT NULL,
      total_posts INTEGER DEFAULT 0,
      used_posts INTEGER DEFAULT 0,
      remaining_posts INTEGER DEFAULT 0,
      last_post_at DATETIME,
      last_replenishment_at DATETIME,
      total_cost REAL DEFAULT 0,
      total_tokens INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // Post logs table - tracks posting attempts and results
  post_logs: `
    CREATE TABLE IF NOT EXISTS post_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bot_id TEXT NOT NULL,
      post_id INTEGER,
      attempt_number INTEGER DEFAULT 1,
      success BOOLEAN NOT NULL,
      tweet_id TEXT,
      error_message TEXT,
      response_time_ms INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts (id)
    )
  `,

  // Generation logs table - tracks OpenAI API usage
  generation_logs: `
    CREATE TABLE IF NOT EXISTS generation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bot_id TEXT NOT NULL,
      batch_size INTEGER NOT NULL,
      tokens_used INTEGER NOT NULL,
      cost REAL NOT NULL,
      model TEXT NOT NULL,
      success_count INTEGER DEFAULT 0,
      failure_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // Health checks table - tracks system health
  health_checks: `
    CREATE TABLE IF NOT EXISTS health_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bot_id TEXT NOT NULL,
      status TEXT NOT NULL,
      database_connected BOOLEAN,
      twitter_api_healthy BOOLEAN,
      openai_api_healthy BOOLEAN,
      posts_remaining INTEGER,
      errors TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // Bot configurations table - stores bot-specific settings
  bot_configs: `
    CREATE TABLE IF NOT EXISTS bot_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bot_id TEXT UNIQUE NOT NULL,
      personality_prompt TEXT NOT NULL,
      content_sources TEXT,
      posting_style TEXT,
      topics TEXT,
      tone TEXT,
      max_length INTEGER DEFAULT 280,
      schedule_cron TEXT DEFAULT '0 9 * * *',
      timezone TEXT DEFAULT 'America/Denver',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `
};

// Indexes for performance
export const DATABASE_INDEXES = [
  // Posts table indexes
  'CREATE INDEX IF NOT EXISTS idx_posts_bot_id ON posts(bot_id)',
  'CREATE INDEX IF NOT EXISTS idx_posts_used ON posts(used)',
  'CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category)',
  
  // Post logs indexes
  'CREATE INDEX IF NOT EXISTS idx_post_logs_bot_id ON post_logs(bot_id)',
  'CREATE INDEX IF NOT EXISTS idx_post_logs_created_at ON post_logs(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_post_logs_success ON post_logs(success)',
  
  // Generation logs indexes
  'CREATE INDEX IF NOT EXISTS idx_generation_logs_bot_id ON generation_logs(bot_id)',
  'CREATE INDEX IF NOT EXISTS idx_generation_logs_created_at ON generation_logs(created_at)',
  
  // Health checks indexes
  'CREATE INDEX IF NOT EXISTS idx_health_checks_bot_id ON health_checks(bot_id)',
  'CREATE INDEX IF NOT EXISTS idx_health_checks_created_at ON health_checks(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_health_checks_status ON health_checks(status)'
];

// Triggers for automatic updates
export const DATABASE_TRIGGERS = [
  // Update updated_at timestamp on posts table
  `
    CREATE TRIGGER IF NOT EXISTS update_posts_updated_at
    AFTER UPDATE ON posts
    BEGIN
      UPDATE posts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `,
  
  // Update updated_at timestamp on bot_configs table
  `
    CREATE TRIGGER IF NOT EXISTS update_bot_configs_updated_at
    AFTER UPDATE ON bot_configs
    BEGIN
      UPDATE bot_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `,
  
  // Update bot_stats when posts are marked as used
  `
    CREATE TRIGGER IF NOT EXISTS update_bot_stats_on_post_used
    AFTER UPDATE ON posts
    WHEN NEW.used = 1 AND OLD.used = 0
    BEGIN
      UPDATE bot_stats 
      SET used_posts = used_posts + 1,
          remaining_posts = remaining_posts - 1,
          last_post_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE bot_id = NEW.bot_id;
    END
  `
];

// Views for common queries
export const DATABASE_VIEWS = [
  // View for available posts (unused posts)
  `
    CREATE VIEW IF NOT EXISTS available_posts AS
    SELECT p.*, bc.personality_prompt, bc.posting_style
    FROM posts p
    LEFT JOIN bot_configs bc ON p.bot_id = bc.bot_id
    WHERE p.used = 0
    ORDER BY p.created_at ASC
  `,
  
  // View for bot performance summary
  `
    CREATE VIEW IF NOT EXISTS bot_performance AS
    SELECT 
      bs.bot_id,
      bs.total_posts,
      bs.used_posts,
      bs.remaining_posts,
      bs.total_cost,
      bs.total_tokens,
      bs.last_post_at,
      bs.last_replenishment_at,
      COUNT(pl.id) as total_attempts,
      SUM(CASE WHEN pl.success = 1 THEN 1 ELSE 0 END) as successful_posts,
      AVG(pl.response_time_ms) as avg_response_time
    FROM bot_stats bs
    LEFT JOIN post_logs pl ON bs.bot_id = pl.bot_id
    GROUP BY bs.bot_id
  `
];

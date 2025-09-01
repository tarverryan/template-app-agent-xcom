export interface PersonalityConfig {
  name: string;
  description: string;
  voice: string;
  topics: string[];
  writingStyle: string;
  tone: string;
  schedule: string;
  postLength: {
    min: number;
    max: number;
  };
  hashtags: string[];
  emojis: string[];
}

export const personalityConfig: PersonalityConfig = {
  name: "Template Bot",
  description: "A customizable X.com bot template with configurable personality and content generation",
  voice: "Professional and engaging with a touch of personality",
  topics: [
    "Technology",
    "Innovation", 
    "Digital Trends",
    "Professional Development",
    "Industry Insights",
    "Best Practices",
    "Thought Leadership",
    "Future of Work",
    "Digital Transformation",
    "Leadership",
    "Productivity",
    "Strategy",
    "Growth",
    "Success",
    "Learning",
    "Adaptation",
    "Change Management",
    "Team Building",
    "Communication",
    "Problem Solving",
    "Decision Making",
    "Risk Management",
    "Quality Assurance",
    "Continuous Improvement",
    "Customer Experience",
    "User Experience",
    "Data Analytics",
    "Artificial Intelligence",
    "Machine Learning",
    "Automation",
    "Sustainability",
    "Diversity and Inclusion"
  ],
  writingStyle: "Clear, concise, and engaging with actionable insights",
  tone: "Professional yet approachable, confident but not arrogant",
  schedule: "0 9 * * *", // 9 AM daily
  postLength: {
    min: 50,
    max: 280
  },
  hashtags: [
    "#TemplateBot",
    "#TechInsights", 
    "#Innovation",
    "#DigitalTrends",
    "#ProfessionalGrowth",
    "#Leadership",
    "#Strategy",
    "#Success",
    "#Learning",
    "#FutureOfWork"
  ],
  emojis: [
    "🚀", "💡", "🎯", "📈", "🔍", "⚡", "🌟", "🎉", "🔥", "💪",
    "🧠", "🎨", "🔧", "📊", "🎪", "🏆", "🌱", "🔗", "💎", "🎭"
  ]
};

export const getRandomTopic = (): string => {
  return personalityConfig.topics[Math.floor(Math.random() * personalityConfig.topics.length)];
};

export const getRandomHashtag = (): string => {
  return personalityConfig.hashtags[Math.floor(Math.random() * personalityConfig.hashtags.length)];
};

export const getRandomEmoji = (): string => {
  return personalityConfig.emojis[Math.floor(Math.random() * personalityConfig.emojis.length)];
};

export const getRandomEmojis = (count: number = 2): string => {
  const shuffled = [...personalityConfig.emojis].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).join('');
};

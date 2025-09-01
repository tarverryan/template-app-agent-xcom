// This file serves as a placeholder for shared OpenAI service utilities
// Individual bot implementations will extend or implement their own OpenAI services

export interface OpenAIServiceInterface {
  initialize(): Promise<void>;
  generatePosts(batchSize: number, categories: string[]): Promise<any[]>;
  healthCheck(): Promise<boolean>;
}

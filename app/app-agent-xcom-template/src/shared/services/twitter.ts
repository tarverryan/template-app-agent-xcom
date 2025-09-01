// This file serves as a placeholder for shared Twitter service utilities
// Individual bot implementations will extend or implement their own Twitter services

export interface TwitterServiceInterface {
  initialize(): Promise<void>;
  postTweet(content: string): Promise<string>;
  healthCheck(): Promise<boolean>;
}

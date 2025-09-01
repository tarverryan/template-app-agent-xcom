// This file serves as a placeholder for shared post manager service utilities
// Individual bot implementations will extend or implement their own post manager services

export interface PostManagerServiceInterface {
  initialize(): Promise<void>;
  getNextPost(): Promise<any | null>;
  storePosts(posts: any[]): Promise<void>;
  getRemainingPostCount(): Promise<number>;
}

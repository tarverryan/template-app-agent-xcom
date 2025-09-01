// This file serves as a placeholder for shared scheduler service utilities
// Individual bot implementations will extend or implement their own scheduler services

export interface SchedulerServiceInterface {
  initialize(): Promise<void>;
  scheduleTask(cronExpression: string, task: () => Promise<void>): void;
  stop(): void;
}

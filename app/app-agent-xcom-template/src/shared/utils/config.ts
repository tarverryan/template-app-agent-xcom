import { EnvironmentSchema, Environment } from '../types';

export function loadConfig(): Environment {
  try {
    return EnvironmentSchema.parse(process.env);
  } catch (error) {
    throw new Error(`Configuration validation failed: ${error}`);
  }
}

export const config = loadConfig();

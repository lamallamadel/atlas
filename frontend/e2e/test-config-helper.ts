import { test as base } from '@playwright/test';

export interface TestConfig {
  database: 'h2' | 'postgres';
  auth: 'mock' | 'keycloak';
  backendUrl: string;
}

export function getTestConfig(): TestConfig {
  const configName = process.env.PLAYWRIGHT_CONFIG || 'default';
  
  const configs: Record<string, TestConfig> = {
    'default': {
      database: 'h2',
      auth: 'mock',
      backendUrl: process.env.BACKEND_URL || 'http://localhost:8080'
    },
    'h2-mock': {
      database: 'h2',
      auth: 'mock',
      backendUrl: process.env.BACKEND_URL || 'http://localhost:8080'
    },
    'h2-keycloak': {
      database: 'h2',
      auth: 'keycloak',
      backendUrl: process.env.BACKEND_URL || 'http://localhost:8080'
    },
    'postgres-mock': {
      database: 'postgres',
      auth: 'mock',
      backendUrl: process.env.BACKEND_URL || 'http://localhost:8080'
    },
    'postgres-keycloak': {
      database: 'postgres',
      auth: 'keycloak',
      backendUrl: process.env.BACKEND_URL || 'http://localhost:8080'
    }
  };
  
  return configs[configName] || configs['default'];
}

export function skipIfAuth(authType: 'mock' | 'keycloak') {
  const config = getTestConfig();
  return config.auth !== authType;
}

export function skipIfDatabase(dbType: 'h2' | 'postgres') {
  const config = getTestConfig();
  return config.database !== dbType;
}

export function getTimestampTolerance(): number {
  const config = getTestConfig();
  return config.database === 'h2' ? 1000 : 100;
}

export function shouldSkipKeycloakTests(): boolean {
  const config = getTestConfig();
  return config.auth !== 'keycloak';
}

export function shouldSkipMockAuthTests(): boolean {
  const config = getTestConfig();
  return config.auth !== 'mock';
}

export const test = base.extend<{ testConfig: TestConfig }>({
  testConfig: async ({}, use) => {
    await use(getTestConfig());
  }
});

export { expect } from '@playwright/test';

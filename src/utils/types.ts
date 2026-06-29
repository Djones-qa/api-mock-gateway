export interface MockDefinition {
  method: string;
  path: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: Record<string, unknown>;
  response: MockResponse;
  delay?: DelayConfig;
  chaos?: ChaosConfig;
  contract?: ContractConfig;
}

export interface MockResponse {
  status?: number;
  headers?: Record<string, string>;
  body?: string;
  template?: boolean;
}

export interface DelayConfig {
  fixed?: number;
  min?: number;
  max?: number;
}

export interface ChaosConfig {
  enabled: boolean;
  probability: number;
  types?: ChaosType[];
}

export type ChaosType = 'http500' | 'timeout' | 'reset';

export interface ContractConfig {
  openapi: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  request: {
    method: string;
    path: string;
    headers: Record<string, string | string[] | undefined>;
    query: Record<string, string | string[] | undefined>;
    body: unknown;
    bodyTruncated?: boolean;
  };
  response: {
    status: number;
    headers: Record<string, string | string[] | undefined>;
    body: unknown;
    bodyTruncated?: boolean;
    responseTime: number;
  };
}

export interface GatewayConfig {
  port: number;
  mockDir: string;
  logCapacity: number;
  chaosEnabled: boolean;
}

export interface Stats {
  totalRequests: number;
  requestsPerEndpoint: Record<string, number>;
  averageResponseTime: number;
  errorCount: number;
}

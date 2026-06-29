import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { GatewayConfig } from './types';

const DEFAULTS: GatewayConfig = {
  port: 3000,
  mockDir: './mocks/',
  logCapacity: 1000,
  chaosEnabled: false,
};

function loadConfigFile(): Partial<GatewayConfig> {
  const yamlPath = path.resolve('gateway.config.yaml');
  const jsonPath = path.resolve('gateway.config.json');

  try {
    if (fs.existsSync(yamlPath)) {
      const content = fs.readFileSync(yamlPath, 'utf-8');
      return yaml.load(content) as Partial<GatewayConfig>;
    }
    if (fs.existsSync(jsonPath)) {
      const content = fs.readFileSync(jsonPath, 'utf-8');
      return JSON.parse(content) as Partial<GatewayConfig>;
    }
  } catch (err) {
    console.error(`[config] Error loading config file: ${err}`);
  }

  return {};
}

function loadEnvConfig(): Partial<GatewayConfig> {
  const config: Partial<GatewayConfig> = {};

  const port = process.env.MOCK_GW_PORT;
  if (port !== undefined) {
    const parsed = parseInt(port, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 65535) {
      config.port = parsed;
    } else {
      console.error(`[config] Invalid MOCK_GW_PORT value: ${port}`);
    }
  }

  const mockDir = process.env.MOCK_GW_MOCK_DIR;
  if (mockDir !== undefined) {
    config.mockDir = mockDir;
  }

  const logCapacity = process.env.MOCK_GW_LOG_CAPACITY;
  if (logCapacity !== undefined) {
    const parsed = parseInt(logCapacity, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      config.logCapacity = parsed;
    } else {
      console.error(`[config] Invalid MOCK_GW_LOG_CAPACITY value: ${logCapacity}`);
    }
  }

  const chaosEnabled = process.env.MOCK_GW_CHAOS_ENABLED;
  if (chaosEnabled !== undefined) {
    config.chaosEnabled = chaosEnabled === 'true';
  }

  return config;
}

export function loadConfig(): GatewayConfig {
  const fileConfig = loadConfigFile();
  const envConfig = loadEnvConfig();

  return {
    ...DEFAULTS,
    ...fileConfig,
    ...envConfig,
  };
}

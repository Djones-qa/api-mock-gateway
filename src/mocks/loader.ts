import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { MockDefinition } from '../utils/types';

export function loadMocks(mockDir: string): MockDefinition[] {
  const definitions: MockDefinition[] = [];
  const resolvedDir = path.resolve(mockDir);

  if (!fs.existsSync(resolvedDir)) {
    console.error(`[loader] Mock directory does not exist: ${resolvedDir}`);
    return definitions;
  }

  const files = fs.readdirSync(resolvedDir);
  const mockFiles = files.filter((f) => /\.(yaml|yml|json)$/.test(f));

  for (const file of mockFiles) {
    const filePath = path.join(resolvedDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      let parsed: MockDefinition | MockDefinition[];

      if (file.endsWith('.json')) {
        parsed = JSON.parse(content);
      } else {
        parsed = yaml.load(content) as MockDefinition | MockDefinition[];
      }

      if (Array.isArray(parsed)) {
        definitions.push(...parsed);
      } else {
        definitions.push(parsed);
      }
    } catch (err) {
      console.error(`[loader] Failed to parse ${filePath}: ${err}`);
    }
  }

  return definitions;
}

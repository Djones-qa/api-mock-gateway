import Ajv, { ValidateFunction } from 'ajv';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

const ajv = new Ajv({ allErrors: true });

export function loadSchema(specPath: string): ValidateFunction | null {
  try {
    const content = fs.readFileSync(specPath, 'utf-8');
    let schema: unknown;

    if (specPath.endsWith('.json')) {
      schema = JSON.parse(content);
    } else {
      schema = yaml.load(content);
    }

    return ajv.compile(schema as object);
  } catch (err) {
    console.error(`[contract] Failed to load schema from ${specPath}: ${err}`);
    return null;
  }
}

export function validate(validateFn: ValidateFunction, data: unknown): { valid: boolean; errors: string[] } {
  const valid = validateFn(data);

  if (valid) {
    return { valid: true, errors: [] };
  }

  const errors = (validateFn.errors ?? [])
    .slice(0, 10)
    .map((e) => `${e.instancePath} ${e.message}`);

  return { valid: false, errors };
}

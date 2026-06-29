import { validate } from '../../src/contracts/validator';
import Ajv from 'ajv';

describe('Contract Validator', () => {
  const ajv = new Ajv();
  const schema = {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
    },
    required: ['id', 'name'],
  };

  const validateFn = ajv.compile(schema);

  it('should validate correct data', () => {
    const result = validate(validateFn, { id: '1', name: 'Test' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should return errors for invalid data', () => {
    const result = validate(validateFn, { id: 123 });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

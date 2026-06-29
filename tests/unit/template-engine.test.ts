import { renderTemplate, resetSequence } from '../../src/utils/template-engine';

describe('Template Engine', () => {
  beforeEach(() => {
    resetSequence();
  });

  it('should render simple template with context', () => {
    const result = renderTemplate('Hello {{name}}', { name: 'World' });
    expect(result).toBe('Hello World');
  });

  it('should render nested context values', () => {
    const result = renderTemplate('{{params.id}}', { params: { id: '123' } });
    expect(result).toBe('123');
  });

  it('should generate uuid helper', () => {
    const result = renderTemplate('{{uuid}}', {});
    expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('should generate timestamp helper', () => {
    const result = renderTemplate('{{timestamp}}', {});
    expect(new Date(result).toISOString()).toBe(result);
  });

  it('should generate sequential integers', () => {
    const r1 = renderTemplate('{{seq}}', {});
    const r2 = renderTemplate('{{seq}}', {});
    expect(r1).toBe('1');
    expect(r2).toBe('2');
  });
});

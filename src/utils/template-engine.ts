import Handlebars from 'handlebars';
import { v4 as uuidv4 } from 'uuid';

let sequenceCounter = 0;

Handlebars.registerHelper('uuid', () => uuidv4());

Handlebars.registerHelper('timestamp', () => new Date().toISOString());

Handlebars.registerHelper('seq', () => ++sequenceCounter);

export function renderTemplate(template: string, context: Record<string, unknown>): string {
  const compiled = Handlebars.compile(template);
  return compiled(context);
}

export function resetSequence(): void {
  sequenceCounter = 0;
}

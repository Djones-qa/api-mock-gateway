import { Response } from 'express';
import { MockDefinition } from '../utils/types';
import { renderTemplate } from '../utils/template-engine';

export function sendResponse(
  res: Response,
  definition: MockDefinition,
  params: Record<string, string>,
  query: Record<string, unknown>,
  headers: Record<string, unknown>,
  body: unknown
): void {
  const status = definition.response.status ?? 200;
  const responseHeaders = definition.response.headers ?? {};

  for (const [key, value] of Object.entries(responseHeaders)) {
    res.setHeader(key, value);
  }

  if (!definition.response.body) {
    res.status(status).end();
    return;
  }

  if (definition.response.template === false) {
    res.status(status).send(definition.response.body);
    return;
  }

  try {
    const context = { params, query, headers, body };
    const rendered = renderTemplate(definition.response.body, context);
    res.status(status).send(rendered);
  } catch (err) {
    res.status(500).json({
      error: 'Template rendering failed',
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

import { Request } from 'express';
import { MockDefinition } from '../utils/types';

interface MatchResult {
  definition: MockDefinition;
  params: Record<string, string>;
  score: number;
}

export function matchRequest(req: Request, definitions: MockDefinition[]): MatchResult | null {
  const candidates: MatchResult[] = [];

  for (const def of definitions) {
    if (def.method.toUpperCase() !== req.method.toUpperCase()) {
      continue;
    }

    const params = matchPath(def.path, req.path);
    if (params === null) {
      continue;
    }

    if (def.headers && !matchHeaders(def.headers, req.headers as Record<string, string>)) {
      continue;
    }

    if (def.query && !matchQuery(def.query, req.query as Record<string, string>)) {
      continue;
    }

    if (def.body && !matchBody(def.body, req.body)) {
      continue;
    }

    const score = calculateScore(def);
    candidates.push({ definition: def, params, score });
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

function matchPath(pattern: string, actual: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const actualParts = actual.split('/').filter(Boolean);

  if (patternParts.length !== actualParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = actualParts[i];
    } else if (patternParts[i] !== actualParts[i]) {
      return null;
    }
  }

  return params;
}

function matchHeaders(rules: Record<string, string>, actual: Record<string, string>): boolean {
  for (const [key, value] of Object.entries(rules)) {
    const headerValue = actual[key.toLowerCase()];
    if (!headerValue) return false;

    if (value.startsWith('/') && value.endsWith('/')) {
      const regex = new RegExp(value.slice(1, -1));
      if (!regex.test(headerValue)) return false;
    } else {
      if (headerValue.toLowerCase() !== value.toLowerCase()) return false;
    }
  }
  return true;
}

function matchQuery(rules: Record<string, string>, actual: Record<string, string>): boolean {
  for (const [key, value] of Object.entries(rules)) {
    if (actual[key] !== value) return false;
  }
  return true;
}

function matchBody(rules: Record<string, unknown>, actual: unknown): boolean {
  if (typeof actual !== 'object' || actual === null) return false;

  for (const [key, value] of Object.entries(rules)) {
    if ((actual as Record<string, unknown>)[key] !== value) return false;
  }
  return true;
}

function calculateScore(def: MockDefinition): number {
  let score = 0;

  // Static segments score higher than parameterized
  const parts = def.path.split('/').filter(Boolean);
  for (const part of parts) {
    score += part.startsWith(':') ? 1 : 2;
  }

  // Additional matching rules increase specificity
  if (def.headers) score += Object.keys(def.headers).length;
  if (def.query) score += Object.keys(def.query).length;
  if (def.body) score += Object.keys(def.body).length;

  return score;
}

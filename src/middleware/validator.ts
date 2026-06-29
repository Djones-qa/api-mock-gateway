import { Request, Response, NextFunction } from 'express';

// Placeholder for contract validation middleware
// Full implementation will load OpenAPI specs and validate with AJV
export function validatorMiddleware() {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    next();
  };
}

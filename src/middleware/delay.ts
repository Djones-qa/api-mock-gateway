import { Request, Response, NextFunction } from 'express';
import { MockDefinition } from '../utils/types';

export function delayMiddleware(definition: MockDefinition) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    const delay = definition.delay;

    if (!delay) {
      next();
      return;
    }

    let ms = 0;

    if (delay.fixed !== undefined) {
      if (delay.fixed < 0 || delay.fixed > 30000) {
        console.error(`[delay] Invalid fixed delay: ${delay.fixed}ms`);
        next();
        return;
      }
      ms = delay.fixed;
    } else if (delay.min !== undefined && delay.max !== undefined) {
      if (delay.min < 0 || delay.max > 30000 || delay.min > delay.max) {
        console.error(`[delay] Invalid delay range: ${delay.min}-${delay.max}ms`);
        next();
        return;
      }
      ms = Math.floor(Math.random() * (delay.max - delay.min + 1)) + delay.min;
    }

    if (ms > 0) {
      setTimeout(next, ms);
    } else {
      next();
    }
  };
}

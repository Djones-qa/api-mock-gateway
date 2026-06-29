import { Router, Request, Response } from 'express';
import { MockDefinition } from '../utils/types';
import { matchRequest } from '../mocks/matcher';
import { sendResponse } from '../mocks/responder';
import { delayMiddleware } from '../middleware/delay';
import { chaosMiddleware } from '../middleware/chaos';

export function createMockRouter(definitions: MockDefinition[], chaosEnabled: boolean): Router {
  const router = Router();

  router.use((req: Request, res: Response) => {
    const match = matchRequest(req, definitions);

    if (!match) {
      res.status(404).json({
        error: 'No matching mock definition',
        method: req.method,
        path: req.path,
      });
      return;
    }

    const { definition, params } = match;

    // Apply chaos middleware
    chaosMiddleware(definition, chaosEnabled)(req, res, () => {
      // Apply delay middleware
      delayMiddleware(definition)(req, res, () => {
        sendResponse(
          res,
          definition,
          params,
          req.query as Record<string, unknown>,
          req.headers as Record<string, unknown>,
          req.body
        );
      });
    });
  });

  return router;
}

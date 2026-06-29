import { Request, Response, NextFunction } from 'express';
import { ChaosType, MockDefinition } from '../utils/types';

const TIMEOUT_DURATION = 30000; // 30 seconds

export function chaosMiddleware(definition: MockDefinition, globalEnabled: boolean) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const chaos = definition.chaos;

    if (!chaos || !chaos.enabled || !globalEnabled) {
      next();
      return;
    }

    if (chaos.probability < 0 || chaos.probability > 1) {
      console.error(`[chaos] Invalid probability for ${definition.path}: ${chaos.probability}`);
      next();
      return;
    }

    const roll = Math.random();
    if (roll > chaos.probability) {
      next();
      return;
    }

    const types: ChaosType[] = chaos.types ?? ['http500', 'timeout', 'reset'];
    const selectedType = types[Math.floor(Math.random() * types.length)];

    console.log(`[chaos] Injecting ${selectedType} on ${req.method} ${req.path} at ${new Date().toISOString()}`);

    switch (selectedType) {
      case 'http500':
        res.status(500).json({ error: 'Simulated server error (chaos mode)' });
        break;
      case 'timeout':
        setTimeout(() => {
          req.socket.destroy();
        }, TIMEOUT_DURATION);
        break;
      case 'reset':
        req.socket.destroy();
        break;
    }
  };
}

import { chaosMiddleware } from '../../src/middleware/chaos';
import { MockDefinition } from '../../src/utils/types';
import { Request, Response, NextFunction } from 'express';

describe('Chaos Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    mockReq = { method: 'GET', path: '/test', socket: { destroy: jest.fn() } } as unknown as Partial<Request>;
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  it('should pass through when chaos is disabled', () => {
    const definition: MockDefinition = {
      method: 'GET',
      path: '/test',
      chaos: { enabled: false, probability: 1.0 },
      response: { status: 200 },
    };

    chaosMiddleware(definition, true)(mockReq as Request, mockRes as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should pass through when global chaos is disabled', () => {
    const definition: MockDefinition = {
      method: 'GET',
      path: '/test',
      chaos: { enabled: true, probability: 1.0 },
      response: { status: 200 },
    };

    chaosMiddleware(definition, false)(mockReq as Request, mockRes as Response, next);
    expect(next).toHaveBeenCalled();
  });
});

import { sendResponse } from '../../src/mocks/responder';
import { MockDefinition } from '../../src/utils/types';
import { Response } from 'express';

describe('Responder', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    };
  });

  it('should send static response without template processing', () => {
    const definition: MockDefinition = {
      method: 'GET',
      path: '/test',
      response: { status: 200, body: '{"static": true}', template: false },
    };

    sendResponse(mockRes as Response, definition, {}, {}, {}, {});
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.send).toHaveBeenCalledWith('{"static": true}');
  });

  it('should default to status 200', () => {
    const definition: MockDefinition = {
      method: 'GET',
      path: '/test',
      response: { body: 'hello', template: false },
    };

    sendResponse(mockRes as Response, definition, {}, {}, {}, {});
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });
});

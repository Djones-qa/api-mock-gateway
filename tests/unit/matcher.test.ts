import { matchRequest } from '../../src/mocks/matcher';
import { MockDefinition } from '../../src/utils/types';
import { Request } from 'express';

describe('Request Matcher', () => {
  const definitions: MockDefinition[] = [
    {
      method: 'GET',
      path: '/users/:id',
      response: { status: 200, body: '{"id": "{{params.id}}"}' },
    },
    {
      method: 'GET',
      path: '/users',
      response: { status: 200, body: '[]', template: false },
    },
  ];

  it('should match a simple path', () => {
    const req = { method: 'GET', path: '/users', headers: {}, query: {}, body: {} } as unknown as Request;
    const result = matchRequest(req, definitions);
    expect(result).not.toBeNull();
    expect(result!.definition.path).toBe('/users');
  });

  it('should match a parameterized path', () => {
    const req = { method: 'GET', path: '/users/123', headers: {}, query: {}, body: {} } as unknown as Request;
    const result = matchRequest(req, definitions);
    expect(result).not.toBeNull();
    expect(result!.params.id).toBe('123');
  });

  it('should return null for unmatched paths', () => {
    const req = { method: 'GET', path: '/unknown', headers: {}, query: {}, body: {} } as unknown as Request;
    const result = matchRequest(req, definitions);
    expect(result).toBeNull();
  });

  it('should return null for wrong method', () => {
    const req = { method: 'POST', path: '/users', headers: {}, query: {}, body: {} } as unknown as Request;
    const result = matchRequest(req, definitions);
    expect(result).toBeNull();
  });
});

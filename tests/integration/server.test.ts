import request from 'supertest';
import { createApp } from '../../src/server/app';
import { GatewayConfig } from '../../src/utils/types';
import * as path from 'path';

describe('Server Integration', () => {
  const config: GatewayConfig = {
    port: 3000,
    mockDir: path.join(__dirname, '../../mocks'),
    logCapacity: 100,
    chaosEnabled: false,
  };

  const { app } = createApp(config);

  it('should return health status', async () => {
    const res = await request(app).get('/__admin/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('mockCount');
  });

  it('should return 404 for unmatched routes', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should match mock definitions', async () => {
    const res = await request(app).get('/users');
    expect(res.status).toBe(200);
  });
});

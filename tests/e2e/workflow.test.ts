import request from 'supertest';
import { createApp } from '../../src/server/app';
import { GatewayConfig } from '../../src/utils/types';
import * as path from 'path';

describe('E2E Workflow', () => {
  const config: GatewayConfig = {
    port: 3000,
    mockDir: path.join(__dirname, '../../mocks'),
    logCapacity: 100,
    chaosEnabled: false,
  };

  const { app } = createApp(config);

  it('should complete a full request/response cycle and log it', async () => {
    // Make a request
    const res = await request(app).get('/users');
    expect(res.status).toBe(200);

    // Check it was logged
    const logs = await request(app).get('/__admin/logs');
    expect(logs.status).toBe(200);
    expect(logs.body.length).toBeGreaterThan(0);
  });

  it('should show stats after requests', async () => {
    const stats = await request(app).get('/__admin/stats');
    expect(stats.status).toBe(200);
    expect(stats.body).toHaveProperty('totalRequests');
    expect(stats.body.totalRequests).toBeGreaterThan(0);
  });

  it('should clear logs', async () => {
    const del = await request(app).delete('/__admin/logs');
    expect(del.status).toBe(204);

    const logs = await request(app).get('/__admin/logs');
    expect(logs.body).toHaveLength(0);
  });
});

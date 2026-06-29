import { Router } from 'express';
import { RequestLogger } from '../middleware/logger';
import { Stats } from '../utils/types';

export function createDashboardRouter(logger: RequestLogger, startTime: Date, getMockCount: () => number): Router {
  const router = Router();

  router.get('/__admin/logs', (_req, res) => {
    res.json(logger.getAll());
  });

  router.get('/__admin/logs/:id', (req, res) => {
    const entry = logger.getById(req.params.id);
    if (!entry) {
      res.status(404).json({ error: `Correlation ID ${req.params.id} not found` });
      return;
    }
    res.json(entry);
  });

  router.delete('/__admin/logs', (_req, res) => {
    logger.clear();
    res.status(204).end();
  });

  router.get('/__admin/stats', (_req, res) => {
    const logs = logger.getAll();
    const stats: Stats = {
      totalRequests: logs.length,
      requestsPerEndpoint: {},
      averageResponseTime: 0,
      errorCount: 0,
    };

    let totalTime = 0;
    for (const log of logs) {
      const key = `${log.request.method} ${log.request.path}`;
      stats.requestsPerEndpoint[key] = (stats.requestsPerEndpoint[key] || 0) + 1;
      totalTime += log.response.responseTime;
      if (log.response.status >= 400) {
        stats.errorCount++;
      }
    }

    stats.averageResponseTime = logs.length > 0 ? Math.round(totalTime / logs.length) : 0;
    res.json(stats);
  });

  router.get('/__admin/health', (_req, res) => {
    const uptimeSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
    res.json({
      uptime: uptimeSeconds,
      mockCount: getMockCount(),
    });
  });

  return router;
}

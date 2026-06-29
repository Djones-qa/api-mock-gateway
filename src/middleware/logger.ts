import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LogEntry } from '../utils/types';

const MAX_BODY_SIZE = 1024 * 1024; // 1 MB

export class RequestLogger {
  private logs: LogEntry[] = [];
  private capacity: number;

  constructor(capacity = 1000) {
    this.capacity = Math.max(1, capacity);
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const id = uuidv4();
      const startTime = Date.now();

      const entry: LogEntry = {
        id,
        timestamp: new Date().toISOString(),
        request: {
          method: req.method,
          path: req.path,
          headers: req.headers as Record<string, string | string[] | undefined>,
          query: req.query as Record<string, string | string[] | undefined>,
          body: this.truncateBody(req.body),
          bodyTruncated: this.isBodyTruncated(req.body),
        },
        response: {
          status: 0,
          headers: {},
          body: null,
          responseTime: 0,
        },
      };

      const originalSend = res.send.bind(res);
      res.send = (body: unknown) => {
        entry.response = {
          status: res.statusCode,
          headers: res.getHeaders() as Record<string, string | string[] | undefined>,
          body: this.truncateBody(body),
          bodyTruncated: this.isBodyTruncated(body),
          responseTime: Date.now() - startTime,
        };
        this.addEntry(entry);
        return originalSend(body);
      };

      res.setHeader('X-Correlation-ID', id);
      next();
    };
  }

  getAll(): LogEntry[] {
    return [...this.logs].reverse();
  }

  getById(id: string): LogEntry | undefined {
    return this.logs.find((entry) => entry.id === id);
  }

  clear(): void {
    this.logs = [];
  }

  getCount(): number {
    return this.logs.length;
  }

  private addEntry(entry: LogEntry): void {
    if (this.logs.length >= this.capacity) {
      this.logs.shift();
    }
    this.logs.push(entry);
  }

  private truncateBody(body: unknown): unknown {
    if (typeof body === 'string' && body.length > MAX_BODY_SIZE) {
      return body.slice(0, MAX_BODY_SIZE);
    }
    return body;
  }

  private isBodyTruncated(body: unknown): boolean {
    return typeof body === 'string' && body.length > MAX_BODY_SIZE;
  }
}

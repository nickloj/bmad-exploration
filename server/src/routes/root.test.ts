import Fastify from 'fastify';
import { describe, it, expect } from 'vitest';
import rootRoutes from './root.js';

function buildApp() {
  const app = Fastify();
  app.register(rootRoutes);
  return app;
}

describe('root routes', () => {
  it('GET / returns { status: ok }', async () => {
    const app = buildApp();
    await app.ready();
    const res = await app.inject({ method: 'GET', url: '/' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
    await app.close();
  });

  it('GET /health returns { status: ok }', async () => {
    const app = buildApp();
    await app.ready();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
    await app.close();
  });
});

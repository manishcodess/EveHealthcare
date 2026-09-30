import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';

describe('Health & Global Error Handlers', () => {
  it('GET /health - should return 200 OK with server status and metadata', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.status).toBe('UP');
    expect(res.body.data.service).toContain('EVE Healthcare');
    expect(res.body.data.timestamp).toBeDefined();
  });

  it('GET /api - should return 200 OK with API directory and endpoint list', async () => {
    const res = await request(app).get('/api');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.service).toContain('EVE Healthcare');
    expect(res.body.data.endpoints).toBeDefined();
    expect(res.body.data.endpoints.auth.signup).toBe('POST /api/auth/signup');
  });

  it('GET / - should redirect to /api-docs', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/api-docs');
  });

  it('GET /docs - should redirect to /api-docs', async () => {
    const res = await request(app).get('/docs');

    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/api-docs');
  });

  it('GET /api-docs.json - should return OpenAPI 3.0 specification JSON', async () => {
    const res = await request(app).get('/api-docs.json');

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toContain('EVE Healthcare');
    expect(res.body.paths['/api/auth/signup']).toBeDefined();
    expect(res.body.paths['/api/bookings']).toBeDefined();
    expect(res.body.paths['/api/payments/webhook']).toBeDefined();
  });

  it('GET /api/non-existent-route - should return 404 with structured error', async () => {
    const res = await request(app).get('/api/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toContain('Resource not found');
  });
});

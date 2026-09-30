import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';

describe('API Documentation Endpoints (/api-docs)', () => {
  it('GET /api-docs/ - should serve Swagger UI documentation HTML', async () => {
    const res = await request(app).get('/api-docs/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Swagger UI');
  });

  it('GET /api-docs.json - should return valid OpenAPI 3.0 specification JSON', async () => {
    const res = await request(app).get('/api-docs.json');

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toContain('EVE Healthcare');
    expect(res.body.paths['/api/payments/webhook']).toBeDefined();
    expect(res.body.paths['/api/bookings/{id}/cancel']).toBeDefined();
  });
});

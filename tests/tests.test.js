import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';

describe('Diagnostic Tests Endpoints (/api/tests)', () => {
  let createdTestId;

  it('GET /api/tests - should retrieve all diagnostic tests with centre offerings', async () => {
    const res = await request(app).get('/api/tests');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);

    const firstTest = res.body.data[0];
    expect(firstTest.id).toBeDefined();
    expect(firstTest.name).toBeDefined();
    expect(firstTest.availableAtCentres).toBeInstanceOf(Array);

    createdTestId = firstTest.id;
  });

  it('GET /api/tests/:id - should retrieve a specific test by ID with centre offerings', async () => {
    const res = await request(app).get(`/api/tests/${createdTestId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdTestId);
    expect(res.body.data.availableAtCentres).toBeInstanceOf(Array);
  });

  it('GET /api/tests/:id - should return 404 for non-existent test ID', async () => {
    const res = await request(app).get('/api/tests/non-existent-test-id');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

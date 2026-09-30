import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';

describe('Diagnostic Centres Endpoints (/api/centres)', () => {
  let createdCentreId;

  it('GET /api/centres - should retrieve all diagnostic centres with available tests and prices', async () => {
    const res = await request(app).get('/api/centres');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);

    const firstCentre = res.body.data[0];
    expect(firstCentre.id).toBeDefined();
    expect(firstCentre.name).toBeDefined();
    expect(firstCentre.location).toBeDefined();
    expect(firstCentre.availableTests).toBeInstanceOf(Array);

    createdCentreId = firstCentre.id;
  });

  it('GET /api/centres/:id - should retrieve a specific centre with tests and offering prices', async () => {
    const res = await request(app).get(`/api/centres/${createdCentreId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdCentreId);
    expect(res.body.data.availableTests).toBeInstanceOf(Array);
    if (res.body.data.availableTests.length > 0) {
      expect(res.body.data.availableTests[0].price).toBeGreaterThan(0);
    }
  });

  it('GET /api/centres/:id - should return 404 for non-existent centre ID', async () => {
    const res = await request(app).get('/api/centres/non-existent-centre-id');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

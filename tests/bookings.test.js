import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Bookings Endpoints (/api/bookings)', () => {
  let userAToken;
  let userBToken;
  let sampleCentre;
  let sampleTest;
  let sampleOffering;
  let userABookingId;

  beforeAll(async () => {
    // 1. Authenticate or create User A
    const userAEmail = `user_a_${Date.now()}@evehealthcare.com`;
    const userASignup = await request(app).post('/api/auth/signup').send({
      name: 'User Alpha',
      email: userAEmail,
      password: 'Password123',
    });
    userAToken = userASignup.body.data.token;

    // 2. Authenticate or create User B
    const userBEmail = `user_b_${Date.now()}@evehealthcare.com`;
    const userBSignup = await request(app).post('/api/auth/signup').send({
      name: 'User Beta',
      email: userBEmail,
      password: 'Password123',
    });
    userBToken = userBSignup.body.data.token;

    // 3. Fetch an existing centre with offerings
    const centresRes = await request(app).get('/api/centres');
    const validCentres = centresRes.body.data.filter((c) => c.availableTests.length > 0);
    sampleCentre = validCentres[0];
    sampleTest = sampleCentre.availableTests[0];
    sampleOffering = sampleTest;
  });

  it('POST /api/bookings - should reject request without authorization token with 401', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    const res = await request(app).post('/api/bookings').send({
      centreId: sampleCentre.id,
      testId: sampleTest.testId,
      appointmentDate: futureDate.toISOString(),
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
  });

  it('POST /api/bookings - should create a booking with status PENDING and server-calculated price', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    // Note: Attempting to send a fake client amount (e.g. 1.00) to verify server uses DB offering price
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        centreId: sampleCentre.id,
        testId: sampleTest.testId,
        appointmentDate: futureDate.toISOString(),
        amount: 1.0, // Should be ignored in favor of DB price
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.status).toBe('PENDING');
    // Verify server assigned correct offering price, NOT the client submitted 1.00
    expect(res.body.data.amount).toBe(sampleOffering.price);
    expect(res.body.data.centre.id).toBe(sampleCentre.id);
    expect(res.body.data.test.id).toBe(sampleTest.testId);

    userABookingId = res.body.data.id;
  });

  it('POST /api/bookings - should reject booking with past appointment date with 400', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        centreId: sampleCentre.id,
        testId: sampleTest.testId,
        appointmentDate: pastDate.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/bookings - should reject booking for non-existent centre with 404', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        centreId: 'non-existent-centre-id',
        testId: sampleTest.testId,
        appointmentDate: futureDate.toISOString(),
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('POST /api/bookings - should reject booking for non-existent test with 404', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        centreId: sampleCentre.id,
        testId: 'non-existent-test-id',
        appointmentDate: futureDate.toISOString(),
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('POST /api/bookings - should reject booking when test is not offered by the centre with 400', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    // Find all tests to find one not offered at sampleCentre
    const allTestsRes = await request(app).get('/api/tests');
    const offeredTestIds = sampleCentre.availableTests.map((t) => t.testId);
    const unofferedTest = allTestsRes.body.data.find((t) => !offeredTestIds.includes(t.id));

    if (unofferedTest) {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          centreId: sampleCentre.id,
          testId: unofferedTest.id,
          appointmentDate: futureDate.toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BAD_REQUEST');
      expect(res.body.error.message).toContain('not currently offered');
    }
  });

  it('GET /api/bookings - should reject malformed or invalid JWT token with 401', async () => {
    const res = await request(app)
      .get('/api/bookings')
      .set('Authorization', 'Bearer invalid.token.payload');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
  });

  it('GET /api/bookings - should retrieve only authenticated user bookings', async () => {
    const res = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.some((b) => b.id === userABookingId)).toBe(true);
  });

  it('GET /api/bookings/:id - should retrieve own booking details successfully', async () => {
    const res = await request(app)
      .get(`/api/bookings/${userABookingId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(userABookingId);
    expect(res.body.data.amount).toBe(sampleOffering.price);
  });

  it('GET /api/bookings/:id - should reject access to another user booking with 403 Forbidden', async () => {
    const res = await request(app)
      .get(`/api/bookings/${userABookingId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTHORIZATION_ERROR');
    expect(res.body.error.message).toContain('not have permission');
  });

  it('GET /api/bookings/:id - should return 404 for non-existent booking ID', async () => {
    const res = await request(app)
      .get('/api/bookings/non-existent-booking-id')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import app from '../src/app.js';

describe('Payments Endpoints (/api/payments & /payments)', () => {
  let userAToken;
  let userBToken;
  let sampleCentre;
  let sampleTest;
  let userABookingId;
  let userBBookingId;

  beforeAll(async () => {
    // 1. Setup User A
    const userAEmail = `pay_user_a_${Date.now()}@evehealthcare.com`;
    const userASignup = await request(app).post('/api/auth/signup').send({
      name: 'Payment User Alpha',
      email: userAEmail,
      password: 'Password123',
    });
    userAToken = userASignup.body.data.token;

    // 2. Setup User B
    const userBEmail = `pay_user_b_${Date.now()}@evehealthcare.com`;
    const userBSignup = await request(app).post('/api/auth/signup').send({
      name: 'Payment User Beta',
      email: userBEmail,
      password: 'Password123',
    });
    userBToken = userBSignup.body.data.token;

    // 3. Get centres & tests
    const centresRes = await request(app).get('/api/centres');
    sampleCentre = centresRes.body.data[0];
    sampleTest = sampleCentre.availableTests[0];

    // 4. Create booking for User A
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        centreId: sampleCentre.id,
        testId: sampleTest.testId,
        appointmentDate: futureDate.toISOString(),
      });
    userABookingId = bookingRes.body.data.id;

    // 5. Create booking for User B
    const bookingBRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        centreId: sampleCentre.id,
        testId: sampleTest.testId,
        appointmentDate: futureDate.toISOString(),
      });
    userBBookingId = bookingBRes.body.data.id;
  });

  it('POST /api/payments - should reject unauthenticated request with 401', async () => {
    const res = await request(app).post('/api/payments').send({
      bookingId: userABookingId,
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
  });

  it('POST /api/payments - should reject paying for another user booking with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        bookingId: userBBookingId, // User B's booking
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTHORIZATION_ERROR');
    expect(res.body.error.message).toContain('not have permission');
  });

  it('POST /api/payments - should reject payment for non-existent booking with 404', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        bookingId: 'non-existent-booking-id',
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('POST /api/payments - should successfully process payment and transition booking to CONFIRMED', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        bookingId: userABookingId,
        paymentMethod: 'UPI',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payment).toBeDefined();
    expect(res.body.data.payment.status).toBe('SUCCESS');
    expect(res.body.data.payment.amount).toBe(sampleTest.price);
    expect(res.body.data.payment.transactionId).toBeDefined();
    expect(res.body.data.booking.status).toBe('CONFIRMED');

    // Verify booking lookup reflects CONFIRMED status and payment history
    const checkBooking = await request(app)
      .get(`/api/bookings/${userABookingId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(checkBooking.body.data.status).toBe('CONFIRMED');
    expect(checkBooking.body.data.payments.length).toBeGreaterThan(0);
    expect(checkBooking.body.data.payments[0].status).toBe('SUCCESS');
  });

  it('POST /api/payments - should reject paying an already confirmed booking with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        bookingId: userABookingId, // Already CONFIRMED
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(res.body.error.message).toContain('already confirmed');
  });

  it('POST /api/payments - should support simulated failure and transition booking to FAILED', async () => {
    // Create a new booking for failure simulation
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        centreId: sampleCentre.id,
        testId: sampleTest.testId,
        appointmentDate: futureDate.toISOString(),
      });
    const failBookingId = bookingRes.body.data.id;

    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        bookingId: failBookingId,
        simulateFailure: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payment.status).toBe('FAILED');
    expect(res.body.data.booking.status).toBe('FAILED');
  });

  it('POST /payments - should support direct root alias /payments', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 12);
    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        centreId: sampleCentre.id,
        testId: sampleTest.testId,
        appointmentDate: futureDate.toISOString(),
      });
    const bookingId = bookingRes.body.data.id;

    const res = await request(app)
      .post('/payments')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        bookingId,
        paymentMethod: 'CREDIT_CARD',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payment.status).toBe('SUCCESS');
    expect(res.body.data.booking.status).toBe('CONFIRMED');
  });
});

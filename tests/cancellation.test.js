import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Booking Cancellation (/api/bookings/:id/cancel)', () => {
  let userAToken;
  let userBToken;
  let sampleCentre;
  let sampleTest;
  let activeBookingId;

  beforeAll(async () => {
    // 1. Setup User A
    const userAEmail = `cancel_user_a_${Date.now()}@evehealthcare.com`;
    const userASignup = await request(app).post('/api/auth/signup').send({
      name: 'Cancel User Alpha',
      email: userAEmail,
      password: 'Password123',
    });
    userAToken = userASignup.body.data.token;

    // 2. Setup User B
    const userBEmail = `cancel_user_b_${Date.now()}@evehealthcare.com`;
    const userBSignup = await request(app).post('/api/auth/signup').send({
      name: 'Cancel User Beta',
      email: userBEmail,
      password: 'Password123',
    });
    userBToken = userBSignup.body.data.token;

    // 3. Get centres & tests
    const centresRes = await request(app).get('/api/centres');
    sampleCentre = centresRes.body.data[0];
    sampleTest = sampleCentre.availableTests[0];

    // 4. Create active booking for User A
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        centreId: sampleCentre.id,
        testId: sampleTest.testId,
        appointmentDate: futureDate.toISOString(),
      });
    activeBookingId = bookingRes.body.data.id;
  });

  it('PATCH /api/bookings/:id/cancel - should reject unauthenticated request with 401', async () => {
    const res = await request(app).patch(`/api/bookings/${activeBookingId}/cancel`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
  });

  it('PATCH /api/bookings/:id/cancel - should reject cancelling another user booking with 403 Forbidden', async () => {
    const res = await request(app)
      .patch(`/api/bookings/${activeBookingId}/cancel`)
      .set('Authorization', `Bearer ${userBToken}`); // User B attempting to cancel User A's booking

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTHORIZATION_ERROR');
    expect(res.body.error.message).toContain('not have permission');
  });

  it('PATCH /api/bookings/:id/cancel - should return 404 for non-existent booking ID', async () => {
    const res = await request(app)
      .patch('/api/bookings/non-existent-booking-id/cancel')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('PATCH /api/bookings/:id/cancel - should successfully cancel own booking and update status to CANCELLED', async () => {
    const res = await request(app)
      .patch(`/api/bookings/${activeBookingId}/cancel`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(activeBookingId);
    expect(res.body.data.status).toBe('CANCELLED');

    // Verify database state
    const dbBooking = await prisma.booking.findUnique({ where: { id: activeBookingId } });
    expect(dbBooking.status).toBe('CANCELLED');
  });

  it('PATCH /api/bookings/:id/cancel - should reject cancelling an already cancelled booking with 400', async () => {
    const res = await request(app)
      .patch(`/api/bookings/${activeBookingId}/cancel`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BAD_REQUEST');
    expect(res.body.error.message).toContain('already cancelled');
  });

  it('POST /api/payments - should reject attempting payment on a CANCELLED booking with 400', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        bookingId: activeBookingId, // is CANCELLED
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BAD_REQUEST');
    expect(res.body.error.message).toContain('cancelled booking');
  });
});

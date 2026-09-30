import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Payment Webhooks (/api/payments/webhook & /payments/webhook)', () => {
  let userToken;
  let sampleCentre;
  let sampleTest;

  beforeAll(async () => {
    const userEmail = `webhook_user_${Date.now()}@evehealthcare.com`;
    const userSignup = await request(app).post('/api/auth/signup').send({
      name: 'Webhook Test User',
      email: userEmail,
      password: 'Password123',
    });
    userToken = userSignup.body.data.token;

    const centresRes = await request(app).get('/api/centres');
    sampleCentre = centresRes.body.data[0];
    sampleTest = sampleCentre.availableTests[0];
  });

  const createTestBooking = async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        centreId: sampleCentre.id,
        testId: sampleTest.testId,
        appointmentDate: futureDate.toISOString(),
      });
    return res.body.data.id;
  };

  it('POST /api/payments/webhook - should reject invalid payload with 400 Validation Error', async () => {
    const res = await request(app)
      .post('/api/payments/webhook')
      .send({
        // Missing eventId, bookingId, status
        amount: 100,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/payments/webhook - should return 404 for non-existent booking ID', async () => {
    const res = await request(app)
      .post('/api/payments/webhook')
      .send({
        eventId: `evt_test_${Date.now()}`,
        bookingId: 'non-existent-booking-id',
        status: 'SUCCESS',
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('POST /api/payments/webhook - should successfully process payment SUCCESS and CONFIRM booking', async () => {
    const bookingId = await createTestBooking();
    const eventId = `evt_wh_success_${Date.now()}`;

    const res = await request(app)
      .post('/api/payments/webhook')
      .send({
        eventId,
        bookingId,
        status: 'SUCCESS',
        paymentMethod: 'RAZORPAY_MOCK',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.idempotent).toBe(false);
    expect(res.body.data.bookingStatus).toBe('CONFIRMED');
    expect(res.body.data.payment.status).toBe('SUCCESS');

    // Verify DB state
    const bookingInDb = await prisma.booking.findUnique({ where: { id: bookingId } });
    expect(bookingInDb.status).toBe('CONFIRMED');
  });

  it('POST /api/payments/webhook - should process payment FAILED and update booking to FAILED', async () => {
    const bookingId = await createTestBooking();
    const eventId = `evt_wh_failed_${Date.now()}`;

    const res = await request(app)
      .post('/api/payments/webhook')
      .send({
        eventId,
        bookingId,
        status: 'FAILED',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.idempotent).toBe(false);
    expect(res.body.data.bookingStatus).toBe('FAILED');
    expect(res.body.data.payment.status).toBe('FAILED');
  });

  it('CRITICAL IDEMPOTENCY: should handle duplicate sequential webhooks safely without duplicate payments', async () => {
    const bookingId = await createTestBooking();
    const eventId = `evt_idempotency_seq_${Date.now()}`;

    // Delivery 1
    const res1 = await request(app)
      .post('/api/payments/webhook')
      .send({ eventId, bookingId, status: 'SUCCESS' });

    expect(res1.status).toBe(200);
    expect(res1.body.data.idempotent).toBe(false);
    expect(res1.body.data.bookingStatus).toBe('CONFIRMED');

    // Delivery 2 (Duplicate)
    const res2 = await request(app)
      .post('/api/payments/webhook')
      .send({ eventId, bookingId, status: 'SUCCESS' });

    expect(res2.status).toBe(200);
    expect(res2.body.data.idempotent).toBe(true);
    expect(res2.body.data.message).toContain('already processed');

    // Delivery 3 (Duplicate)
    const res3 = await request(app)
      .post('/api/payments/webhook')
      .send({ eventId, bookingId, status: 'SUCCESS' });

    expect(res3.status).toBe(200);
    expect(res3.body.data.idempotent).toBe(true);

    // Assert DB invariant: Exactly 1 payment and 1 webhookEvent for this eventId
    const paymentsCount = await prisma.payment.count({ where: { eventId } });
    const webhookEventsCount = await prisma.webhookEvent.count({ where: { eventId } });

    expect(paymentsCount).toBe(1);
    expect(webhookEventsCount).toBe(1);
  });

  it('CRITICAL CONCURRENCY: should handle simultaneous/concurrent duplicate webhooks race conditions', async () => {
    const bookingId = await createTestBooking();
    const eventId = `evt_concurrent_race_${Date.now()}`;

    // Fire 5 identical requests simultaneously
    const promises = Array.from({ length: 5 }, () =>
      request(app)
        .post('/api/payments/webhook')
        .send({ eventId, bookingId, status: 'SUCCESS' })
    );

    const responses = await Promise.all(promises);

    // All 5 must succeed with 200 OK
    responses.forEach((res) => {
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    // Exactly one must be the primary processor, the rest must be recognized as idempotent
    const primaryCount = responses.filter((r) => r.body.data.idempotent === false).length;
    const idempotentCount = responses.filter((r) => r.body.data.idempotent === true).length;

    expect(primaryCount).toBe(1);
    expect(idempotentCount).toBe(4);

    // Assert DB invariant: Exactly 1 record created
    const paymentsCount = await prisma.payment.count({ where: { eventId } });
    const webhookEventsCount = await prisma.webhookEvent.count({ where: { eventId } });

    expect(paymentsCount).toBe(1);
    expect(webhookEventsCount).toBe(1);
  });

  it('STATE PROTECTION: should reject marking an already CONFIRMED booking as FAILED with 409', async () => {
    const bookingId = await createTestBooking();
    const successEventId = `evt_confirm_first_${Date.now()}`;

    // Confirm booking first
    await request(app)
      .post('/api/payments/webhook')
      .send({ eventId: successEventId, bookingId, status: 'SUCCESS' });

    // Send subsequent conflicting FAILED event
    const failedEventId = `evt_late_failure_${Date.now()}`;
    const res = await request(app)
      .post('/api/payments/webhook')
      .send({ eventId: failedEventId, bookingId, status: 'FAILED' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(res.body.error.message).toContain('already confirmed');
  });

  it('POST /payments/webhook - should support direct root alias /payments/webhook', async () => {
    const bookingId = await createTestBooking();
    const eventId = `evt_root_alias_${Date.now()}`;

    const res = await request(app)
      .post('/payments/webhook')
      .send({
        eventId,
        bookingId,
        status: 'SUCCESS',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookingStatus).toBe('CONFIRMED');
  });
});

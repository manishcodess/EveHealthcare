import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'EVE Healthcare Diagnostic Booking API',
      version: '1.0.0',
      description: `
**EVE Healthcare API** — Production-ready backend service for diagnostic test discovery, centre offerings, appointment bookings, mock payments, and webhook event processing.

### Key Architectural Highlights:
- **Stateless JWT Authentication:** Use the \`/api/auth/login\` endpoint to receive a Bearer token.
- **Server-Side Price Integrity:** Booking amounts are calculated server-side from authoritative \`CentreTestOffering\` records.
- **Idempotent Webhooks:** The \`/api/payments/webhook\` endpoint guarantees single-execution semantics via database constraints and transactional atomic processing.
- **Data Isolation:** Enforces strict user-level authorization across booking access, payment, and cancellation.
      `,
      contact: {
        name: 'EVE Healthcare Engineering Team',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: `${env.NODE_ENV} server`,
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from /api/auth/login or /api/auth/signup',
        },
      },
      schemas: {
        StandardSuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation completed successfully' },
            data: { type: 'object' },
          },
        },
        StandardErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Detailed error description' },
                details: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
        SignupRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'Dr. Jane Doe' },
            email: { type: 'string', format: 'email', example: 'jane.doe@evehealthcare.com' },
            password: { type: 'string', minLength: 8, example: 'Password123' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'alice@evehealthcare.com' },
            password: { type: 'string', example: 'Password123' },
          },
        },
        CreateBookingRequest: {
          type: 'object',
          required: ['centreId', 'testId', 'appointmentDate'],
          properties: {
            centreId: { type: 'string', format: 'uuid', example: '1cb24c26-2172-4e9e-9d89-f2b42629a77e' },
            testId: { type: 'string', format: 'uuid', example: '2da35d37-3283-5f0f-ae9a-e3c53730b88f' },
            appointmentDate: { type: 'string', format: 'date-time', example: '2026-10-15T09:30:00.000Z' },
          },
        },
        CreatePaymentRequest: {
          type: 'object',
          required: ['bookingId'],
          properties: {
            bookingId: { type: 'string', format: 'uuid', example: '3eb46e48-4394-6a1a-bf0b-f4d64841c99a' },
            paymentMethod: { type: 'string', example: 'CREDIT_CARD' },
            simulateFailure: { type: 'boolean', default: false, example: false },
          },
        },
        WebhookRequest: {
          type: 'object',
          required: ['eventId', 'bookingId', 'status'],
          properties: {
            eventId: { type: 'string', example: 'evt_stripe_mock_9921' },
            bookingId: { type: 'string', format: 'uuid', example: '3eb46e48-4394-6a1a-bf0b-f4d64841c99a' },
            status: { type: 'string', enum: ['SUCCESS', 'FAILED'], example: 'SUCCESS' },
            amount: { type: 'number', example: 450.0 },
            paymentMethod: { type: 'string', example: 'UPI' },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          summary: 'Service Health Check',
          description: 'Returns server operational status, uptime, and metadata',
          tags: ['Health'],
          responses: {
            200: {
              description: 'Service is operational',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/StandardSuccessResponse' } } },
            },
          },
        },
      },
      '/api/auth/signup': {
        post: {
          summary: 'Register a new patient account',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SignupRequest' } } },
          },
          responses: {
            201: { description: 'User registered successfully with JWT token' },
            400: { description: 'Validation error' },
            409: { description: 'Email already registered' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          summary: 'Authenticate patient credentials',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
          },
          responses: {
            200: { description: 'Login successful, JWT token issued' },
            401: { description: 'Invalid email or password' },
          },
        },
      },
      '/api/centres': {
        get: {
          summary: 'List all diagnostic centres with test offerings and prices',
          tags: ['Diagnostic Centres'],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name or location' },
            { name: 'location', in: 'query', schema: { type: 'string' }, description: 'Filter by location' },
            { name: 'testId', in: 'query', schema: { type: 'string' }, description: 'Filter centres offering a specific test' },
          ],
          responses: {
            200: { description: 'List of diagnostic centres with test pricing' },
          },
        },
      },
      '/api/centres/{id}': {
        get: {
          summary: 'Get diagnostic centre details by ID',
          tags: ['Diagnostic Centres'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Centre details and full test price list' },
            404: { description: 'Centre not found' },
          },
        },
      },
      '/api/tests': {
        get: {
          summary: 'List all diagnostic tests with available centres',
          tags: ['Diagnostic Tests'],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search tests by name or description' },
            { name: 'centreId', in: 'query', schema: { type: 'string' }, description: 'Filter tests offered by a specific centre' },
          ],
          responses: {
            200: { description: 'List of diagnostic tests' },
          },
        },
      },
      '/api/tests/{id}': {
        get: {
          summary: 'Get diagnostic test details by ID',
          tags: ['Diagnostic Tests'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Test details and offering centres with pricing' },
            404: { description: 'Test not found' },
          },
        },
      },
      '/api/bookings': {
        post: {
          summary: 'Create a new appointment booking (status starts PENDING)',
          tags: ['Bookings'],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateBookingRequest' } } },
          },
          responses: {
            201: { description: 'Booking created with server-computed price snapshot' },
            400: { description: 'Invalid date or test not offered at centre' },
            401: { description: 'Unauthorized' },
            404: { description: 'Centre or Test not found' },
          },
        },
        get: {
          summary: 'Retrieve all bookings for the authenticated user',
          tags: ['Bookings'],
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED'] } },
          ],
          responses: {
            200: { description: 'User bookings list' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/bookings/{id}': {
        get: {
          summary: 'Retrieve booking details by ID (ownership enforced)',
          tags: ['Bookings'],
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Booking details with payment history' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden — booking belongs to another patient' },
            404: { description: 'Booking not found' },
          },
        },
      },
      '/api/bookings/{id}/cancel': {
        patch: {
          summary: 'Cancel an existing booking (ownership enforced)',
          tags: ['Bookings'],
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Booking cancelled successfully' },
            400: { description: 'Cannot cancel past or already cancelled booking' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Booking not found' },
          },
        },
      },
      '/api/payments': {
        post: {
          summary: 'Process direct mock payment for a booking',
          tags: ['Payments'],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatePaymentRequest' } } },
          },
          responses: {
            201: { description: 'Payment executed and booking transitioned (CONFIRMED or FAILED)' },
            400: { description: 'Cannot pay cancelled booking' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden — not your booking' },
            404: { description: 'Booking not found' },
            409: { description: 'Booking already paid/confirmed' },
          },
        },
      },
      '/api/payments/webhook': {
        post: {
          summary: 'Idempotent Payment Webhook Receiver',
          description: 'Simulates payment provider webhook delivery. Guaranteed single-execution idempotency via database unique constraints.',
          tags: ['Payments'],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/WebhookRequest' } } },
          },
          responses: {
            200: { description: 'Webhook processed or idempotent replay recognized' },
            400: { description: 'Invalid payload or target booking cancelled' },
            404: { description: 'Booking not found' },
            409: { description: 'Conflict — attempted to mark confirmed booking as failed' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

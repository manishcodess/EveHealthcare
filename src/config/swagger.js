export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'EVE Healthcare — Diagnostic Booking API',
    version: '1.0.0',
    description:
      'Production-ready REST API for diagnostic test bookings, lab discovery, mock payment processing, and idempotent webhook callbacks.',
    contact: {
      name: 'EVE Healthcare Engineering',
      email: 'support@evehealthcare.example.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
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
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation successful' },
          data: { type: 'object' },
        },
      },
      ApiErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Invalid input data' },
              details: { type: 'object' },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' },
          name: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', format: 'email', example: 'jane.doe@example.com' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        },
      },
      DiagnosticTest: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Complete Blood Count (CBC)' },
          description: { type: 'string', example: 'Measures white and red blood cells, platelets, and hemoglobin' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CentreTestOffering: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          price: { type: 'string', example: '450.00' },
          test: { $ref: '#/components/schemas/DiagnosticTest' },
        },
      },
      DiagnosticCentre: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Apollo Diagnostics - Indiranagar' },
          location: { type: 'string', example: 'Indiranagar, Bangalore' },
          offerings: {
            type: 'array',
            items: { $ref: '#/components/schemas/CentreTestOffering' },
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          centreId: { type: 'string', format: 'uuid' },
          testId: { type: 'string', format: 'uuid' },
          appointmentDate: { type: 'string', format: 'date-time', example: '2026-10-15T09:30:00.000Z' },
          amount: { type: 'string', example: '450.00' },
          status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED'], example: 'PENDING' },
          centre: { $ref: '#/components/schemas/DiagnosticCentre' },
          test: { $ref: '#/components/schemas/DiagnosticTest' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Payment: {
        type: 'object',
        properties: {
          paymentId: { type: 'string', format: 'uuid' },
          transactionId: { type: 'string', example: 'TXN_1727678400000_A1B2C3' },
          status: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'], example: 'SUCCESS' },
          amount: { type: 'string', example: '450.00' },
          booking: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              status: { type: 'string', example: 'CONFIRMED' },
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Service Health Check',
        tags: ['System'],
        responses: {
          200: {
            description: 'System is healthy and responsive',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'UP' },
                        service: { type: 'string', example: 'EVE Healthcare Diagnostic Booking Service' },
                        timestamp: { type: 'string', example: '2026-09-30T10:00:00.000Z' },
                        uptime: { type: 'number', example: 124.5 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/signup': {
      post: {
        summary: 'Register a new patient account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Jane Doe' },
                  email: { type: 'string', format: 'email', example: 'jane.doe@example.com' },
                  password: { type: 'string', minLength: 8, example: 'Password123!' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/AuthResponse' },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error' },
          409: { description: 'User already exists' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Authenticate existing user and retrieve JWT token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'jane.doe@example.com' },
                  password: { type: 'string', example: 'Password123!' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Authentication successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/AuthResponse' },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/api/centres': {
      get: {
        summary: 'List diagnostic centres with their test offerings and prices',
        tags: ['Centres & Catalog'],
        responses: {
          200: {
            description: 'List of centres',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/DiagnosticCentre' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/centres/{id}': {
      get: {
        summary: 'Get diagnostic centre details and offerings by ID',
        tags: ['Centres & Catalog'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Diagnostic centre details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/DiagnosticCentre' },
                  },
                },
              },
            },
          },
          404: { description: 'Diagnostic centre not found' },
        },
      },
    },
    '/api/tests': {
      get: {
        summary: 'List available diagnostic tests catalogue',
        tags: ['Tests'],
        responses: {
          200: {
            description: 'List of diagnostic tests',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/DiagnosticTest' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/tests/{id}': {
      get: {
        summary: 'Get diagnostic test details by ID',
        tags: ['Tests'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Test details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/DiagnosticTest' },
                  },
                },
              },
            },
          },
          404: { description: 'Test not found' },
        },
      },
    },
    '/api/bookings': {
      get: {
        summary: 'List all bookings for authenticated user',
        tags: ['Bookings'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'User bookings',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Booking' },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Create a new diagnostic test booking',
        tags: ['Bookings'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['centreId', 'testId', 'appointmentDate'],
                properties: {
                  centreId: { type: 'string', format: 'uuid', example: 'centre-uuid-1' },
                  testId: { type: 'string', format: 'uuid', example: 'test-uuid-1' },
                  appointmentDate: { type: 'string', format: 'date-time', example: '2026-10-15T09:30:00.000Z' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Booking created with PENDING status and authoritative price',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Booking' },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error or test not offered at centre' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/bookings/{id}': {
      get: {
        summary: 'Get booking details by ID',
        tags: ['Bookings'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Booking details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Booking' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          404: { description: 'Booking not found' },
        },
      },
    },
    '/api/bookings/{id}/cancel': {
      patch: {
        summary: 'Cancel a pending or confirmed booking',
        tags: ['Bookings'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Booking successfully cancelled',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Booking cancelled successfully' },
                    data: { $ref: '#/components/schemas/Booking' },
                  },
                },
              },
            },
          },
          400: { description: 'Cannot cancel an already completed or failed booking' },
          401: { description: 'Unauthorized' },
          404: { description: 'Booking not found' },
        },
      },
    },
    '/api/payments': {
      post: {
        summary: 'Process mock payment for a booking',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['bookingId'],
                properties: {
                  bookingId: { type: 'string', format: 'uuid', example: 'booking-uuid-1' },
                  paymentMethod: { type: 'string', example: 'MOCK_GATEWAY' },
                  simulateFailure: { type: 'boolean', example: false },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Payment processed successfully and booking CONFIRMED',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Payment processed successfully' },
                    data: { $ref: '#/components/schemas/Payment' },
                  },
                },
              },
            },
          },
          400: { description: 'Payment failed or invalid booking state' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/payments/webhook': {
      post: {
        summary: 'Idempotent Webhook callback from Payment Gateway',
        tags: ['Payments'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['eventId', 'bookingId', 'status', 'amount'],
                properties: {
                  eventId: { type: 'string', example: 'evt_gateway_998877' },
                  bookingId: { type: 'string', format: 'uuid', example: 'booking-uuid-1' },
                  status: { type: 'string', enum: ['SUCCESS', 'FAILED'], example: 'SUCCESS' },
                  amount: { type: 'number', example: 450.0 },
                  paymentMethod: { type: 'string', example: 'UPI' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Webhook processed (or deduplicated idempotently if eventId was seen before)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Webhook processed: payment created and booking CONFIRMED' },
                    data: {
                      type: 'object',
                      properties: {
                        eventId: { type: 'string', example: 'evt_gateway_998877' },
                        bookingId: { type: 'string', example: 'booking-uuid-1' },
                        bookingStatus: { type: 'string', example: 'CONFIRMED' },
                        paymentStatus: { type: 'string', example: 'SUCCESS' },
                        idempotent: { type: 'boolean', example: false },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid webhook payload or booking already finalized' },
        },
      },
    },
  },
};

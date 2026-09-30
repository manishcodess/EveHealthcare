# EVE Healthcare — Diagnostic Test Booking Service

Backend service for diagnostic test bookings, centre catalog discovery, simulated payments, and idempotent webhook processing. Built with **Node.js (Express)**, **PostgreSQL**, and **Prisma ORM**.

---

## 1. How to Run the Project Locally

### Prerequisites
- Node.js (v18+)
- PostgreSQL instance running locally or via Docker

### Setup Steps
1. **Clone the repository and install dependencies:**
   ```bash
   git clone <repo-url>
   cd EveHealthcare
   npm install
   ```

2. **Configure environment variables:**
   Copy the example environment file and adjust your database connection string if needed:
   ```bash
   cp .env.example .env
   ```
   *Default `.env` contents:*
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/eve_healthcare?schema=public"
   JWT_SECRET="eve_healthcare_super_secret_jwt_key_2026"
   JWT_EXPIRES_IN="7d"
   ```

3. **Run Prisma migrations & seed initial catalogue data:**
   ```bash
   npx prisma migrate dev --name init
   npm run prisma:seed
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   # Server running at http://localhost:5000
   ```

5. **Run automated test suite:**
   ```bash
   npm test
   ```

---

## 2. API Endpoints & Example Requests

### 1. Authentication

#### Register User
`POST /api/auth/signup`
```json
// Request
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!"
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com" },
    "token": "eyJhbGci..."
  }
}
```

#### Login
`POST /api/auth/login`
```json
// Request
{
  "email": "jane@example.com",
  "password": "Password123!"
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com" },
    "token": "eyJhbGci..."
  }
}
```

---

### 2. Diagnostic Centres & Tests

#### List Diagnostic Centres & Available Tests
`GET /api/centres` (Public)
```json
// Response (200 OK)
{
  "success": true,
  "data": [
    {
      "id": "centre-uuid-1",
      "name": "Apollo Diagnostics - Indiranagar",
      "location": "Indiranagar, Bangalore",
      "offerings": [
        {
          "id": "offering-uuid-1",
          "price": "450.00",
          "test": {
            "id": "test-uuid-1",
            "name": "Complete Blood Count (CBC)",
            "description": "Measures white and red blood cells, platelets, and hemoglobin"
          }
        }
      ]
    }
  ]
}
```

#### List Available Diagnostic Tests
`GET /api/tests` (Public)
```json
// Response (200 OK)
{
  "success": true,
  "data": [
    {
      "id": "test-uuid-1",
      "name": "Complete Blood Count (CBC)",
      "description": "Measures overall health and detects wide range of disorders"
    }
  ]
}
```

---

### 3. Bookings

#### Create a Booking
`POST /api/bookings` *(Requires `Authorization: Bearer <token>`)*
```json
// Request
{
  "centreId": "centre-uuid-1",
  "testId": "test-uuid-1",
  "appointmentDate": "2026-10-15T09:30:00.000Z"
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "id": "booking-uuid-1",
    "userId": "user-uuid",
    "centreId": "centre-uuid-1",
    "testId": "test-uuid-1",
    "appointmentDate": "2026-10-15T09:30:00.000Z",
    "amount": "450.00",
    "status": "PENDING"
  }
}
```

#### Get User Bookings
`GET /api/bookings` *(Requires `Authorization: Bearer <token>`)*

#### Cancel Booking
`PATCH /api/bookings/:id/cancel` *(Requires `Authorization: Bearer <token>`)*

---

### 4. Simulated Payments

#### Process Payment
`POST /payments` or `POST /api/payments` *(Requires `Authorization: Bearer <token>`)*
```json
// Request
{
  "bookingId": "booking-uuid-1",
  "paymentMethod": "MOCK_GATEWAY",
  "simulateFailure": false
}

// Response (201 Created)
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "paymentId": "pay-uuid-1",
    "transactionId": "TXN_1727678400000_A1B2C3",
    "status": "SUCCESS",
    "amount": "450.00",
    "booking": {
      "id": "booking-uuid-1",
      "status": "CONFIRMED"
    }
  }
}
```

---

### 5. Payment Webhooks (Idempotent)

#### Process Webhook Event
`POST /payments/webhook` or `POST /api/payments/webhook`
```json
// Request
{
  "eventId": "evt_gateway_998877",
  "bookingId": "booking-uuid-1",
  "status": "SUCCESS",
  "amount": 450.00,
  "paymentMethod": "UPI"
}

// Response (200 OK)
{
  "success": true,
  "message": "Webhook processed: payment created and booking CONFIRMED",
  "data": {
    "eventId": "evt_gateway_998877",
    "bookingId": "booking-uuid-1",
    "bookingStatus": "CONFIRMED",
    "paymentStatus": "SUCCESS"
  }
}

// Sending the same eventId again:
{
  "success": true,
  "message": "Event already processed (idempotent)",
  "data": {
    "eventId": "evt_gateway_998877",
    "idempotent": true
  }
}
```

---

## 3. Database / Schema Design

The relational model is designed using PostgreSQL & Prisma:

```mermaid
erDiagram
    User ||--o{ Booking : places
    DiagnosticCentre ||--o{ CentreTestOffering : offers
    DiagnosticTest ||--o{ CentreTestOffering : included_in
    DiagnosticCentre ||--o{ Booking : hosts
    DiagnosticTest ||--o{ Booking : performs
    Booking ||--o{ Payment : generates
    Booking ||--o{ WebhookEvent : logs

    User {
        String id PK
        String name
        String email UK
        String passwordHash
        DateTime createdAt
    }

    DiagnosticCentre {
        String id PK
        String name
        String location
    }

    DiagnosticTest {
        String id PK
        String name
        String description
    }

    CentreTestOffering {
        String id PK
        String centreId FK
        String testId FK
        Decimal price
    }

    Booking {
        String id PK
        String userId FK
        String centreId FK
        String testId FK
        DateTime appointmentDate
        Decimal amount
        Enum status "PENDING | CONFIRMED | FAILED | CANCELLED"
    }

    Payment {
        String id PK
        String bookingId FK
        String eventId UK
        Decimal amount
        Enum status "PENDING | SUCCESS | FAILED | REFUNDED"
        String transactionId UK
    }

    WebhookEvent {
        String id PK
        String eventId UK
        String bookingId
        String status
        DateTime processedAt
    }
```

### Key Schema Decisions:
- **`CentreTestOffering` Junction Table:** Tests have different operational costs and pricing across different diagnostic centres. A junction table allows individual lab pricing while keeping test metadata normalized.
- **Server-Side Authoritative Amounts:** The booking amount is pulled directly from `CentreTestOffering.price` on the server to prevent client price tampering.
- **Unique Constraints for Idempotency:** `WebhookEvent.eventId` and `Payment.eventId` enforce strict uniqueness at the database level to prevent duplicate payments during retries or race conditions.
- **`Decimal(10, 2)`:** Used for all prices and monetary amounts to prevent binary floating-point rounding inaccuracies.

---

## 4. Important Assumptions Made

1. **Server-Side Pricing Authority:** Clients cannot specify the payment amount in booking or payment requests; the price is strictly determined by the centre offering in the database.
2. **Webhook Trust Model:** Webhook endpoints accept simulated gateway notifications. In production, signature verification (e.g., HMAC-SHA256 headers) would authenticate the webhook sender.
3. **Booking State Machine:**
   - A `CONFIRMED` or `CANCELLED` booking cannot be paid again.
   - Successful payment immediately moves booking from `PENDING` to `CONFIRMED`.
   - Failed payment marks booking as `FAILED`.
4. **Data Isolation:** Users can only view and cancel their own bookings (`userId` authorization check).

---

## 5. What Would Be Improved With More Time

1. **Background Job Processing (BullMQ / Redis):** Move async webhook processing and notification delivery (email/SMS) to a resilient background queue with exponential backoff retries.
2. **Redis Caching:** Cache diagnostic centre and test catalogue queries to reduce PostgreSQL read load on high-traffic discovery endpoints.
3. **Webhook HMAC Signature Verification:** Add cryptographic signature verification (shared secret header) to authenticate payment gateway callbacks.
4. **Time Slot Management:** Add finite appointment capacity per hour for each diagnostic centre to prevent lab overbooking.
5. **Role-Based Access Control (RBAC):** Provide an Admin/Lab-Operator portal for lab staff to manage test offerings, pricing, and view daily appointment schedules.

# Clinic OS Backend

Queue Management System backend for Clinic OS.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Cache/Locks**: Redis
- **Message Queue**: RabbitMQ
- **Real-time**: Server-Sent Events (SSE)

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- RabbitMQ 3+

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start services with Docker**
   ```bash
   docker-compose up -d postgres redis rabbitmq
   ```

4. **Run database migrations**
   ```bash
   npm run migrate
   ```

5. **Seed test data (optional)**
   ```bash
   npm run seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

### Docker Development

Run everything with Docker Compose:

```bash
docker-compose up
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- RabbitMQ on port 5672 (Management UI on 15672)
- Backend API on port 3000

## API Endpoints

### Appointments

- `POST /api/v1/appointments` - Create appointment
- `GET /api/v1/appointments` - List appointments
- `GET /api/v1/appointments/:id` - Get appointment
- `POST /api/v1/appointments/:id/check-in` - Check-in appointment
- `DELETE /api/v1/appointments/:id` - Cancel appointment
- `PATCH /api/v1/appointments/:id/reschedule` - Reschedule appointment

### Visits (Walk-ins)

- `POST /api/v1/visits` - Create walk-in visit
- `GET /api/v1/visits/:id` - Get visit
- `PATCH /api/v1/visits/:id/status` - Update visit status
- `POST /api/v1/visits/:id/reassign` - Reassign visit
- `POST /api/v1/visits/:id/delay` - Delay patient

### Queue

- `GET /api/v1/queue/doctor/:doctorId` - Get doctor queue
- `GET /api/v1/queue/department/:departmentId` - Get department queue
- `POST /api/v1/queue/doctor/:doctorId/next` - Call next patient
- `POST /api/v1/queue/doctor/:doctorId/skip` - Skip patient
- `POST /api/v1/queue/doctor/:doctorId/complete` - Complete visit

### Real-time (SSE)

- `GET /api/v1/sse/reception/:hospitalId` - Reception dashboard
- `GET /api/v1/sse/doctor/:doctorId` - Doctor screen
- `GET /api/v1/sse/waiting-room/:departmentId` - Waiting room (public)

## Authentication

All endpoints (except public waiting room SSE) require JWT authentication:

```
Authorization: Bearer <token>
```

## Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {}
  }
}
```

## Project Structure

```
src/
├── config/          # Configuration files
├── models/           # Sequelize models
├── services/         # Business logic
├── controllers/      # Request handlers
├── routes/           # Route definitions
├── middleware/       # Express middleware
├── utils/            # Utility functions
├── migrations/       # Database migrations
├── seeders/          # Database seeders
├── app.ts            # Express app setup
└── index.ts          # Entry point
```

## Database Models

- **Hospital** - Hospital/tenant entity
- **User** - System users (superadmin, hospital owner, receptionist, doctor)
- **Department** - Hospital departments
- **Doctor** - Doctors linked to users
- **Patient** - Patients (hospital-scoped)
- **HospitalConfig** - Hospital configuration
- **Appointment** - Pre-booked appointments
- **Visit** - Queue items (visits)
- **VisitHistory** - Completed visit history

## Queue Priority

1. VIP/URGENT patients
2. Carryover patients (from previous day)
3. New check-ins (FIFO)

## Features

- ✅ Multi-tenant architecture
- ✅ Token and time-slot booking
- ✅ Walk-in and appointment support
- ✅ Real-time queue updates (SSE)
- ✅ Redis-based concurrency locks
- ✅ RabbitMQ event publishing
- ✅ Role-based access control
- ✅ Carryover patient handling
- ✅ Doctor capacity management
- ✅ Queue length limits (soft)

## License

ISC


# TractorLink – Backend Architecture

---

## 1. Overview

The TractorLink backend is designed using a modular, layered architecture to support a centralized tractor booking and fleet management system.

The architecture ensures:
- Clear separation of concerns
- Maintainability and scalability
- Consistent coding standards

---

## 2. Tech Stack

- Runtime: Node.js
- Framework: Express.js
- ORM: Prisma ORM
- Database: MySQL
- Authentication: JWT (JSON Web Tokens)
- Validation: Zod (Schema validation)

---

## 3. Architecture Pattern

Client → Routes → Controllers → Services → Database (Prisma)

Each layer has a clearly defined responsibility.

---

## 4. Directory Structure

backend/
├── src/                # Core application source
│   ├── controllers/    # Request handlers
│   ├── routes/         # API endpoints
│   ├── services/       # Business logic (Core)
│   ├── middleware/     # Auth & validation
│   ├── config/         # System configuration
│   └── prisma/         # Prisma client
├── docs/               # System documentation (.md)
├── scripts/            # Maintenance & test scripts
├── prisma/             # Database schema & migrations
├── .env                # Environment variables
└── package.json        # Dependencies

---

## 5. Layer Responsibilities

### Routes Layer
- Defines API endpoints
- Connects routes to controllers
- Applies middleware (auth, role check)
- No business logic allowed

---

### Controllers Layer
- Handles request and response
- Extracts data from:
  - req.body
  - req.params
  - req.query
- Calls services to perform operations
- Returns formatted API response
- No database queries here

---

### Services Layer (Core Logic)

This is the most important layer.

Responsibilities:
- Business logic implementation
- Pricing calculation
- Dispatch logic
- Scheduling logic
- Status transition validation

Rules:
- Prisma is used only here
- Functions must be reusable
- Keep logic modular

---

### Prisma Layer
- Defines database schema
- Handles all DB queries
- Accessed only through services

---

### Middleware Layer
- Authentication (JWT)
- Role-based authorization
- Error handling
- Request validation (Zod)

---

## 6. Core Service Modules

### Admin Service
- **Manual Dispatch**: Assign resources to pending jobs.
- **Transactional Settlement**: Create payment record + update status.
- **Unified Ledger**: Aggregate payments and dues for revenue tracking.
- **Operator Enrollment**: Secure creation and decommissioning of operator accounts.

### Operator Service
- **Job Lifecycle**: Manage transitions (en_route → in_progress → completed).
- **Resource Recovery**: Release tractor/operator on job completion.
- **Profile Independence**: Managing personal contact data and interface settings.

### Booking & Pricing Service
- Create booking and calculate estimated price.
- **Historical Snapshots**: Capture and store current hub/service state in the `Booking` record at creation for consistent "Quote" views.

---

## 7. Core System Rules

### No Logic in Routes
Routes should only map endpoints to controllers.

### Controllers Are Thin
Controllers only:
- Receive request
- Call service
- Send response

### Services Contain All Logic
All business rules must be implemented in services.

### Database Access Rule
- Prisma queries only inside services
- Never in controllers or routes

### Historical Consistency Rule (NEW)
- Critical metadata like Hub Name, Hub Location, and Hub Coordinates must be "snapshotted" in the Booking record at creation time.
- This ensures that old quotes remain accurate for audit and invoice purposes even if global settings (like hub address) change.
- Never recalculate historical pricing or locations using current master data; always use the stored snapshots.

### Status Control Rule
Booking status must follow strict order:

Scheduled → Dispatched → En Route → In Progress → Completed → Paid

Invalid transitions must be blocked.

---

## 8. API Design Standards

### REST Principles
- GET → Fetch data
- POST → Create
- PUT/PATCH → Update
- DELETE → Remove

### Standard Response Format

{
  "success": true,
  "data": {},
  "message": "Success"
}

### Error Response

{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Error message"
}

---

## 9. Authentication & Authorization

- JWT-based authentication
- Role-based access control:
  - Farmer
  - Admin
  - Operator

Middleware must:
- Verify token
- Attach user to request
- Check role permissions

---

## 10. Validation Strategy

- Use Zod schemas for request validation
- Validate:
  - Body
  - Params
  - Query

Invalid requests should be rejected before reaching services.

---

## 11. Implementation Workflow

1. Define models in prisma/schema.prisma
2. Run: npx prisma generate
3. Create service logic
4. Create controller
5. Define route
6. Add validation (Zod)
7. Test endpoint

---

## 12. Scalability Considerations

- Modular service-based structure
- Easy to convert into microservices
- Add caching (Redis) in future
- Add queue system for dispatch

---

## 13. Security Standards

- Hash passwords using bcrypt
- Use JWT for authentication
- Validate all inputs using Zod
- Protect sensitive routes
- Do not expose internal errors

---



## Conclusion

This architecture ensures a clean, scalable, and maintainable backend system with strict separation of concerns and well-defined responsibilities across all layers.
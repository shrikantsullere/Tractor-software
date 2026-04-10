# TractorLink – API Specification

This document defines all RESTful API endpoints for the TractorLink backend.

---

## 1. Authentication APIs

### POST /api/auth/register
- Description: Register a new user (**Farmer Only**)
- Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "farmer"
}

---

### POST /api/auth/login
- Description: Authenticate user and return JWT token
- Body:
{
  "email": "john@example.com",
  "password": "securepassword"
}

---

### GET /api/auth/me
- Description: Get logged-in user profile
- Protected: Yes

---

## 2. Farmer APIs (Protected: Role = farmer)

### POST /api/farmer/bookings
- Description: Create new booking
- Body:
{
  "serviceType": "plough",
  "landSize": 5.5,
  "location": "Village A",
  "paymentOption": "full" | "partial" | "later"
}
- Logic:
  - Pricing calculated automatically
  - Payment record created immediately if "full" or "partial" is selected
  - Booking status = Pending
  - Payment status = PAID (if full), PARTIAL (if partial), PENDING (if later)

---

### GET /api/farmer/bookings
- Description: Get all bookings for logged-in farmer

---

### GET /api/farmer/bookings/:id
- Description: Get single booking details (includes hub and service snapshots for the Quote view).

---

### GET /api/farmer/bookings/:id/status
- Description: Get booking status timeline

---

### POST /api/farmer/price-preview
- Description: Get estimated price before booking
- Body:
{
  "serviceType": "plough",
  "landSize": 5.5,
  "location": "Village A"
}

---

## 3. Admin APIs (Protected: Role = admin)

- Description: Get all bookings (global registry)
- Response includes: farmer, service, and payment details (for balance calculation).

---

### GET /api/admin/pending-dispatch
- Description: Get bookings that require scheduling (`pending`) or assignment (`scheduled`).
- Used for: Dispatch Hub Queue.

---

### PUT /api/admin/schedule/:bookingId
- Description: Schedule a pending booking by setting a deployment datetime.
- Body: `{ "scheduledDate": "2026-04-10T10:00:00Z" }`
- Logic:
  - Transition allowed from `pending`.
  - Sets `scheduledAt` field.
  - Updates booking status to `scheduled`.

---

### GET /api/admin/operators
- Description: Get all operators including their assigned tractors (operator_tractors).

---

### PUT /api/admin/assign/:bookingId
- Description: Assign operator and tractor to a booking.
- Body: `{ "operatorId": 5 }`
- Logic:
  - Validates operator availability.
  - Links tractor and operator to booking.
  - Status → `dispatched`.
  - Resource → `busy`.

---

### GET /api/admin/payments
- Description: Get unified financial ledger with pagination and filters.
- Query Parameters: `page`, `limit`, `status` (all|paid|pending), `search` (Entity name/ID).
- Returns: Paginated Confirmed payments + Outstanding dues.
- Stats: `totalRevenue`, `totalUnpaid`.

---

### POST /api/admin/settle-booking/:bookingId
- Description: Mark a booking as paid via admin settlement.
- Logic:
  - Calculates remaining balance.
  - Creates a Payment record (`method: admin_settlement`).
  - Updates booking `status` to `paid` and `paymentStatus` to `PAID`.

| **Payment Statuses** | **Context** |
| :--- | :--- |
| **PENDING** | Initial state (Payment Option: Later) |
| **PARTIAL** | 50% Advance paid (Payment Option: Partial) |
| **PAID** | 100% Settle (Payment Option: Full or Admin Settled) |

---

---

### POST /api/admin/settings
- Description: Update pricing configuration
- Body:
{
  "baseRate": 9000,
  "pricePerKm": 50
}
### GET /api/admin/farmers
- Description: Get all farmers including booking counts.
- Response: `[{ id, name, email, phone, location, totalBookings, status }]`

---

### POST /api/admin/farmers
- Description: Enroll a new farmer with a temporary password.
- Body: `{ name, email, phone, location }`
- Logic:
  - Generates 8-char random password.
  - Hashes and creates user.
  - Returns `tempPassword` (plain).

---

### GET /api/admin/services
- Description: Get all service types with current rates and effective dates.
- Response: `[{ id, name, baseRatePerHectare, effectiveDate }]`

---

### PUT /api/admin/services/:id
- Description: Update service base rate and effective date.
- Body: `{ baseRatePerHectare, effectiveDate }`
- Logic: Validates input and triggers a rate change. 
- Constraint: `effectiveDate` can be past, present, or future.

---

---

---

### GET /api/admin/operator-list
- Description: Get all operators with their account details.
- Used for: Operator Management Table.
- Response: `[{ id, name, email, phone, status, role }]`

---

### POST /api/admin/operators
- Description: Enroll a new operator with a default password.
- Body: `{ name, email, password, phone }`
- Logic:
  - Hashes password.
  - Creates user with `role: operator`.
  - Sets `status: active`.

---

### DELETE /api/admin/operators/:id
- Description: Decommission an operator account.
- Logic:
  - Deletes user record (Safe delete recommended in production).

---

### GET /api/admin/tractors
- Description: Get all tractors in the fleet.
- Response: `[{ id, name, model, status, operatorId, operator: { name } }]`

---

### POST /api/admin/tractors
- Description: Add a new tractor to the fleet.
- Body: `{ name, model }`
- Logic:
  - Initial status: `available`.

---

### PUT /api/admin/tractors/:id
- Description: Update tractor details or assign operator.
- Body: `{ name, model, status, operatorId }`
- Logic:
  - Validates operator role.
  - Enforces 1-to-1 mapping (unassigns previous operator if necessary).
  - Blocks assignment if status is `maintenance`.

---

---

## 4. Operator APIs (Protected: Role = operator)

### GET /api/operator/jobs
- Description: Get jobs assigned to the logged-in operator.
- Includes: Farmer name, service metrics, and location.

---

### GET /api/operator/profile
- Description: Get logged-in operator profile details.
- Response: `{ name, email, phone, role, language, tractor }`

---

### PATCH /api/operator/profile
- Description: Update operator profile information.
- Body: `{ name, email, phone }`
- Logic:
  - Validates email uniqueness.
  - Updates name and phone.

---

### PATCH /api/operator/change-password
- Description: Update account password.
- Body: `{ oldPassword, newPassword }`

---

### PATCH /api/operator/language
- Description: Update interface language preference.
- Body: `{ language: "en" | "naira" }`

---

---

### PATCH /api/operator/job-status/:id
- Description: Update job lifecycle status.
- Body: `{ "status": "en_route" }`
- Logic:
  - Enforces strict sequence: en_route → in_progress → completed.
  - If `completed`: Releases tractor and operator back to `available`.

---

### POST /api/operator/fuel
- Description: Log a new fuel entry.
- Body: 
```json
{
  "liters": 45.5,
  "cost": 5000,
  "station": "TotalEnergies Lagos",
  "receiptUrl": "optional_url"
}
```
- Protected: Yes (Operator Only)

---

### GET /api/operator/fuel
- Description: Get fuel logging history for the operator.
- Returns: Array of FuelLog objects ordered by date.

---

### GET /api/operator/fuel/summary
- Description: Get total fuel consumption and cost metrics.
- Returns: `{ "total_cost": 12000, "total_liters": 150 }`

---

## 5. Payment APIs

### POST /api/payments
- Description: Record payment
- Body:
{
  "bookingId": 5,
  "amount": 45000,
  "method": "momo",
  "reference": "XYZ-123"
}

---

### GET /api/payments/:bookingId
- Description: Get payment details for a booking

---

## 6. Admin Analytics & Reports APIs (Protected: Role = admin)

### GET /api/admin/reports/revenue
- Description: Get revenue grouped by date. Accepts timeframe ranges.
- Query: `?range=7d` or `30d` or `1y`
- Returns: `{ "labels": ["Mon", "Tue"], "data": [1000, 2000] }`

---

### GET /api/admin/reports/service-usage
- Description: Get booking counts split by service type.
- Returns: `[ { "service": "plough", "count": 10 } ]`

---

### GET /api/admin/reports/fleet
- Description: Get general utilization numbers of the active fleet.
- Returns: `{ "total": 60, "active": 52, "maintenance": 8, "efficiency": 72 }`

---

### GET /api/admin/reports/farmers
- Description: Get farmer registration numbers over the past year.
- Returns: `{ "labels": ["Jan", "Feb"], "data": [10, 20] }`

---

## 7. Standard Response Format

### Success
{
  "success": true,
  "data": {},
  "message": "Success"
}

### Error
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Error message"
}

---

## 8. Error Codes

| Code | Description |
|------|------------|
| UNAUTHORIZED | Token missing or invalid |
| FORBIDDEN | User role not allowed |
| RESOURCE_BUSY | Tractor/operator already assigned |
| INVALID_TRANSITION | Invalid status change |
| VALIDATION_ERROR | Invalid request data |

---
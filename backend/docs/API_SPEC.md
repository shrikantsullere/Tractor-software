# TractorLink – API Specification

This document defines all RESTful API endpoints for the TractorLink backend.

---

## 1. Authentication APIs (`/api/auth`)

### POST /api/auth/register
- Description: Register a new user (**Farmer Only**)
- Body:
```json
{
  "name": "John Doe",
  "phone": "08012345678",
  "email": "john@example.com",
  "password": "securepassword"
}
```
- Validation (Zod): name(min 2), phone(10-11 digits), email(optional), password(min 6)
- Role is hardcoded to `farmer` (cannot register as operator/admin)

---

### POST /api/auth/login
- Description: Authenticate user and return JWT token
- Body:
```json
{
  "phone": "08012345678",
  "password": "securepassword"
}
```
- Logic:
  - Finds user by phone number
  - Checks `status === 'active'` (inactive users blocked)
  - Verifies password hash
  - Returns JWT (7-day expiry) + user object

---

### POST /api/auth/logout
- Description: Logout (stateless — client-side token removal)
- Protected: Yes

---

### GET /api/auth/me
- Description: Get logged-in user profile
- Protected: Yes
- Returns: `{ id, name, email, role, status, createdAt }`

---

## 2. Farmer APIs (`/api/farmer`) — Protected: Role = farmer

### Shared Routes (Accessible by all authenticated roles)

#### GET /api/farmer/services
- Description: List all available services and their rates
- Roles: farmer, operator, admin

#### GET /api/farmer/settings/config
- Description: Get system configuration (hub info, fuel prices, etc.)
- Roles: farmer, operator, admin

#### GET /api/farmer/zones
- Description: Get all distance zones
- Roles: farmer, operator, admin

---

### Private Farmer Routes

#### GET /api/farmer/dashboard
- Description: Get farmer dashboard metrics
- Returns: `{ name, location, active_jobs, total_bookings, total_paid }`

#### GET /api/farmer/recent-activity
- Description: Get last 3 completed bookings
- Returns: `[{ id, service_type, land_size, status, amount, created_at }]`

#### GET /api/farmer/upcoming-jobs
- Description: Get active/upcoming jobs (PENDING, SCHEDULED, ASSIGNED, IN_PROGRESS)
- Returns: `[{ id, service_type, date, status, location, land_size, operator_name }]`

---

#### POST /api/farmer/price-preview
- Description: Get estimated price before booking
- Body:
```json
{
  "serviceType": "plough",
  "landSize": 5.5,
  "farmerLatitude": 30.9,
  "farmerLongitude": 75.8
}
```
- Returns: Full pricing breakdown + hub info

---

#### POST /api/farmer/bookings
- Description: Create new booking
- Body:
```json
{
  "serviceType": "plough",
  "landSize": 5.5,
  "location": "Village A",
  "farmerLatitude": 30.9,
  "farmerLongitude": 75.8,
  "paymentOption": "full"
}
```
- Logic:
  - Pricing calculated via pricing engine (zone or fuel-based)
  - Hub/service metadata snapshotted into booking
  - Booking status = `PENDING`
  - Payment status = `PENDING`
  - `paymentOption: 'later'` is **rejected** (digital payment mandatory)

---

#### GET /api/farmer/bookings
- Description: Get all bookings for logged-in farmer (paginated)
- Query: `page`, `limit`, `status`, `search`
- Returns: `{ bookings, pagination: { totalCount, totalPages, currentPage, limit } }`

#### GET /api/farmer/bookings/:id
- Description: Get single booking details (includes hub and service snapshots)

---

#### GET /api/farmer/profile
- Description: Get farmer profile

#### PATCH /api/farmer/profile
- Description: Update farmer profile (name, location)

#### PATCH /api/farmer/change-password
- Description: Change password (requires oldPassword)
- Body: `{ oldPassword, newPassword }`

#### PATCH /api/farmer/language
- Description: Update interface language
- Body: `{ language: "en" | "naira" }`

---

## 3. Admin APIs (`/api/admin`) — Protected: Role = admin

### Dashboard APIs

#### GET /api/admin/dashboard/metrics
- Description: Get aggregated dashboard metrics
- Returns: `{ active_jobs, pending_assignment, fleet_ready, total_revenue }`

#### GET /api/admin/dashboard/assignment-queue
- Description: Get SCHEDULED bookings awaiting assignment
- Returns: `[{ id, farmer_name, service_type, land_size, location, total_price }]`

#### GET /api/admin/dashboard/revenue
- Description: Get revenue chart data
- Query: `timeframe=daily|weekly|monthly`
- Returns: `{ labels: [...], data: [...] }`

#### GET /api/admin/dashboard/fleet
- Description: Get fleet monitoring data
- Returns: `[{ id, operator_name, tractor_model, status, engine_hours, operator_availability }]`

#### GET /api/admin/dashboard/active-jobs
- Description: Get all ASSIGNED/IN_PROGRESS jobs for live tracking map
- Returns: `[{ id, status, farmerName, farmerLatitude, farmerLongitude, operatorId, operatorName, tractorName, serviceName, landSize, scheduledAt }]`

---

### Bookings Management

#### GET /api/admin/bookings
- Description: Get all bookings (paginated, filterable)
- Query: `page`, `limit`, `status`, `search`
- Returns: `{ data, bookings, totalPages, currentPage, totalCount }`
- Data includes farmer, service, payments, and formatted prices

#### GET /api/admin/bookings/:id
- Description: Get full booking details with farmer, service, operator, tractor, payments

---

### Assignment (Dispatch)

#### GET /api/admin/pending-assignment
- Description: Get bookings requiring scheduling (PENDING) or assignment (SCHEDULED)
- Used for: Dispatch Hub Queue

#### PUT /api/admin/schedule/:bookingId
- Description: Schedule a pending booking
- Body: `{ "scheduledDate": "2026-04-10T10:00:00Z" }`
- Logic: Validates PENDING/SCHEDULED state → sets `scheduledAt` → status = `SCHEDULED`
- Triggers: Farmer notification

#### GET /api/admin/operators
- Description: Get available operators (active + available + tractor available)
- Used for: Assignment dropdown

#### PUT /api/admin/assign/:bookingId
- Description: Assign operator (+ auto-link tractor) to a scheduled booking
- Body: `{ "operatorId": 5 }`
- Logic:
  - Validates booking is SCHEDULED
  - Validates operator has available tractor
  - Atomic transaction: booking → ASSIGNED, operator → busy, tractor → IN_USE
- Triggers: Operator + Farmer notifications

---

### Financial Ledger

#### GET /api/admin/payments
- Description: Unified financial ledger (payments + outstanding dues)
- Query: `page`, `limit`, `status` (all|paid|pending|partial), `search`
- Returns: `{ payments, totalRevenue, totalUnpaid, totalPages, currentPage, totalCount }`

#### POST /api/admin/settle-booking/:bookingId
- Description: Admin settlement (**CURRENTLY DISABLED**)
- Logic: Throws error — all payments must be digital
- Status: Endpoint exists but is non-functional by design

---

### Farmer Management

#### GET /api/admin/farmers
- Description: Get all farmers with booking counts
- Returns: `[{ id, name, email, phone, location, totalBookings, status, createdAt }]`

#### PUT /api/admin/farmers/:id/status
- Description: Activate or deactivate a farmer account
- Body: `{ "status": "active" | "inactive" }`

---

### Operator Management

#### GET /api/admin/operator-list
- Description: Get all operators with tractor assignments
- Returns: `[{ id, name, email, phone, status, availability, createdAt, tractor }]`

#### POST /api/admin/operators
- Description: Create a new operator (Admin enrollment)
- Body: `{ name, email, password, phone }`
- Logic: Hashes password, creates user with `role: operator`, `status: active`, `availability: available`

#### DELETE /api/admin/operators/:id
- Description: Delete an operator account (hard delete)

---

### Tractor Management

#### GET /api/admin/tractors
- Description: Get all tractors with maintenance status
- Logic: Auto-flags MAINTENANCE when hoursRemaining ≤ 50
- Returns: `[{ id, name, model, status, operatorId, operator, engineHours, nextServiceDueHours, lastServiceDate, hoursRemaining }]`

#### POST /api/admin/tractors
- Description: Add a new tractor
- Body: `{ name, model, engineHours?, nextServiceDueHours?, lastServiceDate? }`

#### PUT /api/admin/tractors/:id
- Description: Update tractor details or assign/unassign operator
- Body: `{ name, model, status, operatorId, engineHours, nextServiceDueHours, lastServiceDate }`
- Logic: Validates operator role, enforces 1-to-1 mapping, blocks assignment if MAINTENANCE

---

### Reports & Analytics

#### GET /api/admin/reports/revenue?range=7d|30d|1y
- Returns: `{ labels, data }` — Revenue grouped by time period

#### GET /api/admin/reports/service-usage?range=7d|30d|1y
- Returns: `[{ service, count }]` — Booking counts by service type

#### GET /api/admin/reports/fleet
- Returns: `{ total, active, maintenance, efficiency }` — Fleet utilization

#### GET /api/admin/reports/farmers?range=7d|30d|1y
- Returns: `{ labels, data }` — Farmer registration growth

#### GET /api/admin/reports/bookings-analytics?range=7d|30d|1y
- Returns: `{ labels, total, completed }` — Total vs completed bookings

#### GET /api/admin/reports/operator-performance?range=7d|30d|1y
- Returns: `[{ name, completedJobs }]` — Top 5 operators by completed jobs

#### GET /api/admin/reports/job-status?range=7d|30d|1y
- Returns: `[{ status, count }]` — Job status distribution

#### GET /api/admin/reports/tractor-profitability?range=7d|30d|1y
- Returns: `[{ name, revenue }]` — Revenue per tractor

#### GET /api/admin/reports/export?range=7d|30d|1y
- Returns: `{ bookings, revenue, operators }` — Raw export data

---

### System Settings

#### GET /api/admin/settings/config
- Description: Get global system configuration

#### POST /api/admin/settings/config
- Description: Update system configuration
- Body: Any subset of `{ hubName, hubLocation, supportEmail, contactEmail, dieselPrice, avgMileage, serviceIntervalHours, preAlertHours, baseLatitude, baseLongitude, perKmRate, pricingMode }`
- Logic: Logs fuel price changes to `fuel_price_logs` if adminId available

#### GET /api/admin/settings/fuel-history
- Description: Get diesel price change audit trail

---

### Distance Zone Management

#### GET /api/admin/settings/zones
- Description: Get all zones (active + inactive)

#### POST /api/admin/settings/zones
- Description: Create a new zone
- Body: `{ minDistance, maxDistance, surchargePerHectare, status? }`
- Logic: Validates no overlaps/gaps, only one open-ended zone allowed

#### PUT /api/admin/settings/zones/:id
- Description: Update zone configuration

#### DELETE /api/admin/settings/zones/:id
- Description: Soft-delete (sets status to INACTIVE)

---

### Service Rate Management

#### GET /api/admin/services
- Description: Get all services and rates

#### PUT /api/admin/services
- Description: Bulk update service rates
- Body: `{ "plough": 500, "harrow": 400 }`

#### PUT /api/admin/services/:id
- Description: Update single service rate and effective date
- Body: `{ baseRatePerHectare, effectiveDate }`

---

## 4. Operator APIs (`/api/operator`) — Protected: Role = operator

### GET /api/operator/jobs
- Description: Get jobs assigned to the logged-in operator
- Returns: `{ current_job, queue }` — Split into active job and upcoming queue

### GET /api/operator/stats
- Description: Get operator performance statistics
- Returns: `{ hectares_done, total_jobs, engine_hours, unit_health }`

### PATCH /api/operator/job-status/:id
- Description: Update job lifecycle status
- Body: `{ "status": "IN_PROGRESS" }`
- Allowed transitions: ASSIGNED → IN_PROGRESS → COMPLETED
- If COMPLETED: atomic transaction releases operator + tractor

---

### Fuel Logging

#### POST /api/operator/fuel
- Body: `{ liters, cost, station, receiptUrl?, tractorId? }`

#### GET /api/operator/fuel
- Returns: Array of FuelLog objects ordered by date

#### GET /api/operator/fuel/summary
- Returns: `{ total_cost, total_liters }`

---

### Profile Management

#### GET /api/operator/profile
#### PATCH /api/operator/profile
- Body: `{ name, email, phone }`

#### PATCH /api/operator/change-password
- Body: `{ oldPassword, newPassword }`

#### PATCH /api/operator/language
- Body: `{ language: "en" | "naira" }`

---

## 5. Farmer Payment APIs (`/api/payments`) — Protected: Role = farmer

### GET /api/payments/pending
- Description: Get all unpaid/partially paid bookings for the farmer
- Returns: `{ bookings: [{ id, serviceType, totalAmount, paidAmount, remainingAmount, paymentStatus, status }], totalOutstanding }`

### GET /api/payments/history
- Description: Get all payment records for the farmer
- Returns: Array of Payment objects with booking + service details

### POST /api/payments/pay-booking
- Description: Process a digital payment for a specific booking
- Body: `{ bookingId, amount, method? }`
- Logic:
  - Validates ownership and remaining balance
  - Creates Payment record
  - Recalculates `paymentStatus` (PENDING → PARTIAL → PAID)
- Triggers: Farmer + Admin notifications

### POST /api/payments/settle-all
- Description: Bulk settlement (**CURRENTLY DISABLED**)
- Logic: Throws error — payments must be processed individually

---

## 6. Service Request APIs (`/api/request`) — Protected

### POST /api/request/create
- Role: farmer
- Description: Quick service request with GPS location
- Body: `{ serviceType, location: { lat, lng } }`
- Broadcasts: `new:request` event via Socket.IO

### GET /api/request/all
- Role: admin
- Description: Get all service requests

### PATCH /api/request/:id/accept
- Role: admin
- Description: Accept a service request
- Broadcasts: `request:updated` event via Socket.IO

---

## 7. Notification APIs (`/api/notifications`) — Protected: All Roles

### GET /api/notifications
- Description: Get all notifications for the logged-in user (role-scoped)

### PATCH /api/notifications/read-all
- Description: Mark all notifications as read

### PATCH /api/notifications/:id/read
- Description: Mark a specific notification as read

### DELETE /api/notifications
- Description: Delete all notifications for the user

### DELETE /api/notifications/:id
- Description: Delete a specific notification

---

## 8. Standard Response Format

### Success
```json
{
  "success": true,
  "data": {},
  "message": "Success"
}
```

### Error
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Error message"
}
```

---

## 9. Error Codes

| Code | Description |
|:---|:---|
| UNAUTHORIZED | Token missing, invalid, or user inactive |
| FORBIDDEN | User role not allowed for this action |
| RESOURCE_BUSY | Tractor/operator already assigned |
| INVALID_TRANSITION | Invalid booking status change |
| VALIDATION_ERROR | Invalid request data |
| NOT_FOUND | Resource not found |
| ASSIGNMENT_ERROR | Operator assignment failed |
| SCHEDULE_ERROR | Booking scheduling failed |
| REGISTRATION_FAILED | User registration error |

---
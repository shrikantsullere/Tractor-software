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
  "password": "securepassword"
}
```
- Logic:
  - Role is hardcoded to `farmer`.
  - Automatically generates a system email: `phone@tractorlink.app`.

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
  - Finds user by phone number.
  - Checks `status === 'active'` (inactive users blocked).
  - Verifies password hash.
  - Returns JWT (7-day expiry) + user object.

---

### GET /api/auth/me
- Description: Get logged-in user profile
- Protected: Yes
- Returns: `{ id, name, email, phone, role, status, createdAt, language }`

---

## 2. Farmer APIs (`/api/farmer`) — Protected: Role = farmer

### POST /api/farmer/price-preview
- Description: Get comprehensive estimated price before booking.
- Body:
```json
{
  "serviceType": "plough",
  "landSize": 5.5,
  "farmerLatitude": 30.9,
  "farmerLongitude": 75.8
}
```
- Returns:
```json
{
  "basePrice": 25000,
  "distanceKm": 15.6,
  "distanceCharge": 7800,
  "totalPrice": 32800,
  "formattedTotalPrice": "₦32,800.00",
  "zoneName": "10-20 KM",
  "airDistance": 12.0,
  "roadDistance": 15.6
}
```

---

### POST /api/farmer/bookings
- Description: Create a draft booking request (Mandatory Digital Payment).
- Body:
```json
{
  "serviceType": "plough",
  "landSize": 5.5,
  "location": "Village A",
  "farmerLatitude": 30.9,
  "farmerLongitude": 75.8,
  "paymentOption": "full" | "partial"
}
```
- Logic: `paymentOption: 'later'` is **rejected**.

---

### POST /api/farmer/checkout
- Description: Atomic "Pay to Book" flow. Creates booking and records initial payment.
- Body: Same as `POST /api/farmer/bookings`.
- Returns: `{ id, status, paymentStatus, paidAmount, formattedTotalPrice, ... }`

---

### GET /api/farmer/bookings
- Description: Get all bookings for logged-in farmer (paginated).
- Query: `page`, `limit`, `status` (all, pending, scheduled, assigned, in_progress, completed), `search`.

---

## 3. Admin APIs (`/api/admin`) — Protected: Role = admin

### Assignment (Dispatch)

#### PUT /api/admin/schedule/:bookingId
- Description: Schedule a pending booking.
- Body: `{ "scheduledDate": "2026-04-10T10:00:00Z" }`
- Logic: Status transitions to `SCHEDULED`.

#### PUT /api/admin/assign/:bookingId
- Description: Assign operator (+ auto-link tractor) to a scheduled booking.
- Body: `{ "operatorId": 5 }`
- Logic:
  - Atomic transaction: booking → ASSIGNED, operator → busy, tractor → IN_USE.

---

### System Settings

#### GET /api/admin/settings/config
- Returns global config including `pricingMode` (ZONE|FUEL) and `dieselPrice`.

#### POST /api/admin/settings/config
- Update system configuration. Fuel price changes are logged.

#### GET /api/admin/settings/fuel-history
- Description: Get diesel price change audit trail.

---

## 4. Operator APIs (`/api/operator`) — Protected: Role = operator

### GET /api/operator/jobs
- Returns split: `{ current_job, queue }`.

### PATCH /api/operator/job-status/:id
- Description: Update job lifecycle status.
- Allowed transitions: ASSIGNED → IN_PROGRESS → COMPLETED.
- If COMPLETED: Atomic transaction releases operator + tractor.

---

## 5. Standard Response Format

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

## 6. Error Codes

| Code | Description |
|:---|:---|
| UNAUTHORIZED | Token missing or user inactive |
| FORBIDDEN | Role not allowed |
| INVALID_TRANSITION | Invalid status change |
| VALIDATION_ERROR | Zod validation failed |
| NOT_FOUND | Resource missing |
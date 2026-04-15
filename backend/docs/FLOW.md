# TractorLink – Business Flow & State Transitions

---

## 1. Booking Lifecycle Flow

A booking must follow this strict sequence. Status transitions cannot be skipped.

1. **PENDING** (Farmer creates a booking request)
   - System calculates price (zone-based or fuel-based)
   - System snapshots hub/service metadata into the Booking record
   - Farmer selects payment intent (Full or Partial — 'Later'/cash is **disabled**)
   - Booking created with `status: PENDING`, `paymentStatus: PENDING`
   - Digital payment is mandatory — `paymentOption: 'later'` is rejected

2. **SCHEDULED** (Admin sets official deployment Date & Time)
   - Admin reviews pending booking and sets `scheduledAt`
   - Farmer receives notification about scheduling

3. **ASSIGNED** (Admin assigns operator + tractor)
   - Admin selects an available operator (auto-links their tractor)
   - Atomic transaction: booking → ASSIGNED, operator → busy, tractor → IN_USE
   - Both operator and farmer receive notifications

4. **IN_PROGRESS** (Operator starts work on-site)
   - Operator updates status from ASSIGNED → IN_PROGRESS
   - Real-time location tracking active via Socket.IO

5. **COMPLETED** (Operator finishes work)
   - Atomic transaction:
     - Booking status → COMPLETED
     - Operator availability → available
     - Tractor status → AVAILABLE

---

## 2. Payment Status Flow (Decoupled)

Payment status is tracked **independently** from the booking work status via `paymentStatus`.

| Payment Status | Condition |
|:---|:---|
| **PENDING** | No payments recorded yet |
| **PARTIAL** | Total paid ≥ 50% of finalPrice |
| **PAID** | Total paid ≥ 100% of finalPrice |

- Multiple payments per booking are supported (incremental)
- `paymentStatus` is automatically recalculated on each payment
- Payments are **digital only** — admin settlement and cash are disabled

---

## 3. Status Transition Rules

### 3.1 Booking Status Transitions

| Current Status | Next Allowed Status | Action | Actor |
|:---|:---|:---|:---|
| *(none)* | PENDING | Create Booking | Farmer |
| PENDING | SCHEDULED | Schedule (set date/time) | Admin |
| SCHEDULED | ASSIGNED | Assign Operator + Tractor | Admin |
| ASSIGNED | IN_PROGRESS | Start Work | Operator |
| IN_PROGRESS | COMPLETED | Finish Work | Operator |

### 3.2 Status Transition Validator (Current Code)

```javascript
const allowedTransitions = {
  SCHEDULED: ['ASSIGNED'],
  ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [] // Terminal state — payment handled via paymentStatus
};
```

> ⚠️ **IMPORTANT**: The old `EN_ROUTE` status has been removed. Operators go directly from `ASSIGNED` to `IN_PROGRESS`.

> ⚠️ **IMPORTANT**: `PAID` is NOT a booking status. Payment tracking is fully handled by the `paymentStatus` field. The booking lifecycle ends at `COMPLETED`.

---

## 4. Strict Business Rules

### 4.1 No Skipping Steps
- Status must follow defined order: PENDING → SCHEDULED → ASSIGNED → IN_PROGRESS → COMPLETED
- Invalid transitions must return `INVALID_TRANSITION` error

---

### 4.2 Resource Locking

- At `ASSIGNED` (Atomic Transaction):
  - Operator availability → `busy`
  - Tractor status → `IN_USE`

- At `COMPLETED` (Atomic Transaction):
  - Operator availability → `available`
  - Tractor status → `AVAILABLE`

---

### 4.3 Cancellation Rules
- Currently no cancellation flow is implemented in the operator/farmer services
- Cancellation would need to be added as a future feature

---

### 4.4 Pricing & Settlement
- Price at booking time is calculated and snapshotted
- **Data Snapshot**: During booking creation, the system captures:
  - `serviceName` (service name at booking time)
  - `hubName`, `hubLocation` (hub identity at booking time)
  - `hubLatitude`, `hubLongitude` (hub coordinates at booking time)
- Settlement is handled via **farmer digital payments only**
- Admin and cash settlement methods are **disabled** in current code

---

### 4.5 Actor Validation

Only specific roles can perform status updates:

| Role | Allowed Actions |
|:---|:---|
| **Farmer** | Create booking (PENDING) |
| **Admin** | Schedule (SCHEDULED), Assign (ASSIGNED) |
| **Operator** | Start work (IN_PROGRESS), Complete (COMPLETED) |

- Invalid role actions return `FORBIDDEN` error
- Operator ownership is validated (can only update their own assigned bookings)

---

### 4.6 Idempotency Protection

- Repeating the same status update returns success without duplication
- If booking is already at the requested status, the existing booking is returned

---

## 5. Notification Flow

Notifications are triggered at key lifecycle events:

| Event | Recipients | Type |
|:---|:---|:---|
| Booking Scheduled | Farmer | `booking` |
| Operator Assigned | Operator + Farmer | `assignment` |
| Payment Received | Farmer + All Admins | `payment` |

- Notifications are persisted in the `notifications` table
- Real-time delivery via Socket.IO to `user-{userId}` rooms
- Admins receive notifications in the `admin-tracking` room

---

## 6. Real-Time Tracking Flow

### 6.1 Room Architecture

```
tracking:join → { roomId, role, bookingId, operatorId, userId }
                 ↓
                 Operator → joins 'track-booking-{bookingId}'
                 Farmer  → joins 'track-booking-{bookingId}'
                 Admin   → joins 'admin-tracking'
                 All     → join 'user-{userId}' (notifications)
```

### 6.2 Location Update Flow

```
Operator sends: location:update { bookingId, operatorId, lat, lng }
                 ↓
                 1. Broadcast to 'track-booking-{bookingId}'
                 2. Forward to 'admin-tracking'
                 3. Legacy: Broadcast to 'default-room'
```

---

## 7. User Registration & Lifecycle

### 7.1 Public Registration (Farmer)
- **Actor**: Any potential user
- **Role**: Limited to `farmer`
- **Authentication**: Phone number + password
- **Enforcement**: Role is restricted in the registration endpoint

### 7.2 Admin-Controlled Enrollment (Operator)
- **Actor**: Existing Admin
- **Role**: `operator`
- **Data**: Name, email, phone, password (provided by admin)
- **Enforcement**: Created through Admin Management Portal. Operators cannot self-register.

### 7.3 Profile Management
- **Farmers**: Can update name, location, password, language
- **Operators**: Can update name, email, phone, password, language
- **Security**: Password changes require providing the `oldPassword` for verification

### 7.4 Account Status Control
- **Admin can activate/deactivate farmer accounts** via `PUT /api/admin/farmers/:id/status`
- Inactive users are blocked from authentication (checked in both login AND middleware)

---

## 8. Summary

This flow ensures:

- Strict lifecycle control (PENDING → SCHEDULED → ASSIGNED → IN_PROGRESS → COMPLETED)
- Decoupled payment tracking (paymentStatus independent of booking status)
- Proper resource management (atomic locking and release)
- Clear role-based actions with ownership validation
- Controlled user onboarding
- Real-time communication via Socket.IO
- Persistent notification system

This is critical for maintaining system consistency and operational reliability.
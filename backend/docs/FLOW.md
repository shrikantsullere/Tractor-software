# TractorLink – Business Flow & State Transitions

---

## 1. Booking Lifecycle Flow

A booking must follow this strict sequence. Status transitions cannot be skipped.

1. Pending (Farmer creates a booking request + System snapshots hub/service metadata)
   - *Optional*: Farmer selects payment intent (Full/Partial/Later)
   - *Result*: Initial Payment record created if Full/Partial chosen.
2. Scheduled (Admin sets official deployment Date & Time)
3. Dispatched (aka ASSIGNED) (Admin assigns tractor and operator)
4. En Route (Operator starts journey)
5. In Progress (Operator starts work)
6. Completed (Operator finishes work)
7. Paid (Payment confirmed)

---

## 2. Status Transition Rules

| Current Status | Next Allowed Status | Action | Actor |
|----------------|-------------------|--------|-------|
| None | Pending | Create Booking | Farmer |
| Pending | Scheduled | Approve & Schedule | Admin |
| Scheduled | Dispatched / Cancelled | Assign Resources | Admin |
| Dispatched | En Route | Start Journey | Operator |
| En Route | In Progress | Start Work | Operator |
| In Progress | Completed | Finish Work | Operator |
| Completed | Paid (Settled) | Confirm Settlement | Admin |
| Paid | - | Final State | - |

---

## 3. Strict Business Rules

### 3.1 No Skipping Steps
- Status must follow defined order
- Invalid transitions must return `INVALID_TRANSITION`

---

### 3.2 Resource Locking

- At `Dispatched`:
  - Tractor → Busy
  - Operator → Busy

- At `Completed`:
  - Tractor → Available
  - Operator → Available

---

### 3.3 Cancellation Rules

- Booking can be cancelled only in `Scheduled` state
- After `Dispatched`, only Admin can cancel

---

### 3.4 Pricing & Settlement
- Price at `Scheduled` is an estimate.
- **Data Snapshot**: During booking creation (`Scheduled`), the system snapshots the current Hub Name, Location, Coordinates, and Service Name to the `Booking` record.
- Settlement is triggered by **Admin Only** in Phase 1.
- Marking as "Paid" creates a physical ledger entry (`admin_settlement`).

---

### 3.5 Actor Validation

Only specific roles can update status:

- Farmer → Can create booking
- Admin → Can dispatch, cancel, mark paid
- Operator → Can update job progress

Invalid role action must return `FORBIDDEN`

---

### 3.6 Idempotency Protection

- Repeating the same status update should not break system
- If status is already updated, return success without duplication

---

## 4. Status Transition Validator (Backend Logic)

```javascript
const allowedTransitions = {
  scheduled: ['dispatched', 'cancelled'],
  dispatched: ['en_route'],
  en_route: ['in_progress'],
  in_progress: ['completed'],
  completed: ['paid'],
  paid: [],
  cancelled: []
};

function validateStatusChange(current, next) {
  if (!allowedTransitions[current]?.includes(next)) {
    throw new Error("INVALID_TRANSITION");
  }
}
```

---

## 5. Actor-Based Validation (Important)

```javascript
function validateActor(role, nextStatus) {
  const rules = {
    farmer: ['scheduled'],
    admin: ['dispatched', 'cancelled', 'paid'],
    operator: ['en_route', 'in_progress', 'completed']
  };

  if (!rules[role].includes(nextStatus)) {
    throw new Error("FORBIDDEN");
  }
}
```

---

## 6. User Registration & Lifecycle

To ensure security and fleet integrity, user account creation is strictly controlled:

### 6.1 Public Registration (Farmer)
- **Actor**: Any potential user.
- **Role**: Limited to `farmer`.
- **Enforcement**: Role field is hardcoded/restricted in the public registration form.

### 6.2 Admin-Controlled Enrollment (Operator/Admin)
- **Actor**: Existing Admin.
- **Role**: `operator` or `admin`.
- **Enforcement**: Created through the Admin Management Portal. Operators cannot self-register.

### 6.3 Profile Management
- **Farmers**: Can update name and location.
- **Operators**: Can update name, email, and phone.
- **Security**: Password changes require providing the `oldPassword` for verification.

---

## 7. Summary

This flow ensures:

- Strict lifecycle control
- No invalid transitions
- Proper resource management
- Clear role-based actions
- Controlled user onboarding

This is critical for maintaining system consistency and operational reliability.
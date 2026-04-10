# TractorLink – Product Requirement Document (PRD)

---

## 1. Project Overview

TractorLink is a centralized tractor booking and fleet management platform designed to connect farmers with mechanized agricultural services.

The system operates on a **centralized fleet model**, where all tractors and operators are managed by the admin to ensure reliability, standardized pricing, and efficient dispatch.

---

## 2. Objectives

- Enable farmers to easily request tractor services  
- Provide transparent and automated pricing  
- Optimize tractor utilization through centralized dispatch  
- Ensure real-time job tracking and status visibility  
- Maintain structured booking and payment records  

---

## 3. User Roles & Responsibilities

### 3.1 Farmer
- Create booking requests  
- View price estimates  
- Track job status  
- View booking history  
- Make payments  

---

### 3.2 Admin
- Manage all bookings  
- Assign tractors and operators  
- Monitor fleet availability  
- Configure pricing rules (service rates, distance, fuel)  
- **Operator Management**: Direct enrollment and decommissioning of operator accounts.
- View system reports  

---

### 3.3 Operator
- View assigned jobs  
- Navigate to job location  
- Update job status  
- **Profile Management**: Update personal contact details (Name, Email, Phone).
- Execute assigned work  
- Log fuel consumption and expenses

---

## 4. Core Features (MVP)

### 4.1 Booking System
- Farmer inputs:
  - Service type  
  - Land size (hectares)  
  - Location  
- System generates estimated price  
- **Rich Quote View (New)**: Detailed modal showing route flow from Hub to Farmer with clear price itemization.
- Booking is created with status: **Scheduled**
- System snapshots current hub/service metadata at creation.

---

### 4.2 Pricing Engine
- Automated calculation based on:
  - Base rate per hectare  
  - Distance surcharge  
  - Fuel adjustment  
- Pricing is configurable via admin  

---

### 4.3 Dispatch System
- Admin assigns tractor and operator  
- Only available resources can be assigned  
- Assignment updates booking status  

---

### 4.4 Job Tracking
- Status flow:
  - Scheduled  
  - Dispatched  
  - En Route  
  - In Progress  
  - Completed  
- Farmer and admin can track progress  

---

### 4.5 Payment System
- Administrative settlement after job completion.
- Transactional link between payment records and booking status.
- Real-time revenue tracking via unified financial ledger.
- Phase 1: Full settlement by Admin only.

---

### 4.6 History & Records
- All bookings are stored  
- Accessible for both farmer and admin  

---

### 4.7 Fuel Logistics
- Operators record fuel consumption:
  - Liters added
  - Cost incurred
  - Fuel station location
  - Receipt image (optional)
- System tracks:
  - Fuel history per operator
  - Total fuel expenditure
- Admin can monitor overall fleet fuel costs.

---

### 4.8 User Enrollment & Access Control
- **Farmer Registration**: Self-service signup via the public portal. Restricted to `farmer` role.
- **Internal Accounts**: Admins and Operators must be enrolled manually by an existing administrator.
- **Profile Independence**: Operators and Farmers can manage their own profile details and platform interface language.

---

## 5. Business Logic (Core System Rules)

### 5.1 Booking Logic
- Each booking is linked to:
  - One farmer  
  - One service  
  - One location  
- Booking is created with status **Scheduled**

---

### 5.2 Pricing Logic

Total price is calculated using:

Total Price = (Base Rate × Land Size) + Distance Surcharge + Fuel Adjustment

- **Historical Integrity**: Rates and Hub locations are captured at booking time to ensure the "Quote" remains consistent for the farmer even if global rates change later.


#### Base Rate
- Defined per service (e.g., plough, harrow)  
- Calculated per hectare
- **Effective Rate Management**: Admins can update rates with an `effectiveDate` (supports historical corrections and future updates).

#### Distance Surcharge
- First 5 km: No charge  
- Beyond 5 km: Additional cost per km  

#### Fuel Adjustment
- Price adjusted based on fuel cost changes  
- Controlled via admin settings  

**Note:** Price shown at booking time is an estimate.

---

### 5.3 Dispatch Logic
- Only tractors with status **Available** can be assigned  
- Each booking can have only one active assignment  
- Admin can reassign resources if needed  

---

### 5.4 Scheduling Logic
- Farmer does not select date/time  
- System assigns **earliest available slot**  
- Estimated arrival time is calculated  

---

### 5.5 Status Lifecycle

Bookings must follow this order:
Scheduled → Dispatched → En Route → In Progress → Completed → Paid (Settled)

- Paid status is achieved via a transactional settlement operation.



- Invalid transitions are not allowed  
- Each status change is recorded  

---

### 5.6 Resource Management
- One tractor is linked to one operator  
- Once assigned:
  - Tractor = Busy  
  - Operator = Busy  
- Becomes available after job completion  

---

### 5.7 Operator Rules
- Operators can only view assigned jobs  
- Operators cannot modify booking details  

---

### 5.8 Payment Logic
- Payment is linked to booking  
- Booking is finalized only after payment  
- Supports partial and full payment  

---

## 6. Data Model Overview

The system is centered around the **Booking entity**, which connects:

- Farmer  
- Service  
- Tractor  
- Operator  
- Payment  

All operations revolve around bookings.

---

## 7. Non-Functional Requirements

- Scalable system architecture  
- Optimized API performance  
- Data consistency and integrity  
- Secure authentication (JWT-based)  
- Role-based access control  

---

## 8. Assumptions

- All tractors are centrally managed  
- Farmers do not choose operators directly  
- Location is captured via village or GPS  
- Pricing is configurable by admin  

---

## 9. Future Enhancements

- USSD-based booking system  
- Automatic dispatch (algorithm-based)  
- Real-time GPS tracking  
- Multi-language support  
- Analytics dashboard  

---

## 10. Success Criteria

- Farmers can successfully create bookings  
- Admin can assign resources without conflict  
- Operators complete jobs with correct status updates  
- Payments are recorded accurately  
- System handles multiple concurrent bookings  

---
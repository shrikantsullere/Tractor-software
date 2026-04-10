# TractorLink – AI Development Rules & Guardrails

This document defines strict rules for any AI agent or developer working on the TractorLink backend.

---

## 1. Code Integrity & Safety

- Do not overwrite or delete existing logic unless explicitly required
- Always extend or refactor carefully
- Avoid breaking existing functionality
- Ensure idempotent operations (repeat-safe logic)

---

## 2. Architectural Consistency

Follow strict layer separation:

Routes → Controllers → Services → Prisma

### Rules:
- Routes: Only endpoints + middleware
- Controllers: Request handling + service calls
- Services: All business logic
- Prisma: Only inside services

No direct database access in controllers or routes.

---

## 3. Programming Standards

- Use async/await only (no .then chains)
- Use Prisma ORM for all DB operations
- Validate all inputs using Zod
- Keep functions small and reusable
- Return structured responses or throw controlled errors

---

## 4. Naming Conventions

- Database: snake_case
- Backend code:
  - variables/functions → camelCase
  - constants → UPPER_SNAKE_CASE

Maintain consistency across the codebase.

---

## 5. Error Handling & Security

- Use centralized error middleware
- Do not expose sensitive data
- Do not log secrets (passwords, tokens)
- Follow standard API response format

---

## 6. Business Logic Enforcement

- Always validate booking status transitions using FLOW.md
- Never skip lifecycle steps
- Enforce role-based actions:
  - Farmer
  - Admin
  - Operator

---

## 7. AI-Specific Guardrails

Before making any change, AI must:

- Read:
  - PRD.md
  - ARCHITECTURE.md
  - DATABASE_SCHEMA.md
  - API_SPEC.md
  - FLOW.md

- Understand:
  - Business logic
  - Status transitions
  - Role permissions

- Then implement changes

---

## 8. Change Management Rules (VERY IMPORTANT)

To avoid breaking the system:

### 8.1 Backward Compatibility
- Never break existing APIs
- If changes are needed:
  - Extend instead of modifying
  - Add new fields instead of removing old ones

---

### 8.2 Feature Extension Rule
- New features must:
  - Follow existing architecture
  - Reuse services when possible
  - Not duplicate logic

---

### 8.3 Schema Update Rule
- If database schema changes:
  - Update Prisma schema
  - Update DATABASE_SCHEMA.md
  - Run `npx prisma generate`

---

### 8.4 API Change Rule
- Do not modify existing API contracts
- If required:
  - Create new endpoints
  - Maintain old endpoints

---

### 8.5 Dependency Safety
- Avoid introducing heavy dependencies
- Ensure new libraries do not break existing system

---

## 9. Complexity Control Rules

- Avoid deeply nested logic
- Break large functions into smaller ones
- Keep services modular
- Avoid duplicate logic across files

---

## 10. Forbidden Actions

- Do not use var (use const/let)
- Do not hardcode secrets (use .env)
- Do not bypass validation
- Do not write business logic in frontend
- Do not skip status validation
- Do not directly update DB without service layer
- **Admin Settlement Rule**: Marking a booking as `paid` MUST always be done through a transaction that creates a `Payment` record with `method: admin_settlement`.
- **Financial Integrity**: UI statuses must be derived from actual ledger entry metrics (`paidAmount` vs `totalPrice`) rather than just the string status.
- **Farmer Management Rule**: Admin-created farmers MUST be issued a temporary password that is displayed exactly once.
- **Access Control**: Users with `status: inactive` MUST be blocked from authentication.
- **Registration Restriction**: Public registration MUST only permit the `farmer` role. 
- **Operator Lifecycle**: Operators MUST be created by an Admin and cannot self-register.
- **Profile Integrity**: Operator profile updates MUST validate email uniqueness and maintain the `operator` role.
- **Historical Integrity**: Do NOT recalculate prices or locations for existing bookings using current configuration; always use the snapshot fields (`hubName`, `hubLocation`, etc.).
- **Service Rate Flexibility**: Do NOT restrict `effectiveDate` to future dates; allow past and present dates for adjustment and manual entry.


---

## Conclusion

These rules ensure:
- Stable system behavior
- Scalable architecture
- Safe future development
- Consistent AI-generated code

All contributors and AI agents must strictly follow these rules.
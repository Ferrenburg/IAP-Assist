# Sprint 1 — Setup, Auth, Incidents & Shared Data Model

**Week:** 1
**Payment:** $250
**Status:** Not started

---

## Goal

Stand up the project foundation: Next.js + Supabase + Vercel, working auth, and the database schema that supports the shared data model. By end of sprint, a user can sign up, create an incident, create an operational period within it, and enter shared data once that's accessible from anywhere.

---

## Deliverables

### Development Environment
- [ ] Next.js project initialized
- [ ] Git repository structure and branching strategy in place
- [ ] Vercel deployment configured
- [ ] Environment variables and secrets management set up
- [ ] `.env.example` documenting all required vars

### Supabase Configuration
- [ ] Database provisioned
- [ ] Supabase Auth set up with email/password
- [ ] Session handling working
- [ ] Protected routes implemented

### Authentication
- [ ] Sign up flow
- [ ] Login flow
- [ ] Logout flow
- [ ] Basic API error handling and validation

### Database Schema
- [ ] `users` table
- [ ] `organizations` table
- [ ] `incidents` table
- [ ] `operational_periods` table
- [ ] Shared operational-period record table
- [ ] ICS form data tables (or shape decided)
- [ ] Schema documentation written

### Incident Management
- [ ] Create incident
- [ ] Edit incident
- [ ] List incidents
- [ ] Incident name + metadata entry
- [ ] Switch between incidents

### Operational Period Management
- [ ] Create operational period within an incident
- [ ] Set start and end date/time
- [ ] Switch between operational periods

### Shared Data Entry
- [ ] Single entry point for all shared op-period data:
  - incident name
  - incident number
  - operational period number
  - start/end date/time
  - Incident Commander
  - prepared by name + title
  - approved by name
  - agency/organization name

### Sync Engine
- [ ] Shared data stored once and accessible to all form pages for current op period
- [ ] Changes to shared fields propagate everywhere they appear

---

## Success Criteria

- [ ] Users can create accounts and sign in
- [ ] App deploys successfully to Vercel
- [ ] DB schema supports the shared data model
- [ ] Users can create and manage incidents and operational periods
- [ ] Shared data is entered once and stored centrally
- [ ] Shared data is accessible from any form context for the active period

---

## Deliverables for Client Review

- Working authentication flow demo
- Code repository access
- Database schema documentation
- Incident, period, and shared data sync demonstration

---

## Progress Log

<!-- Append session-by-session work notes here. Newest at the bottom of this section. -->

_No entries yet._

---

## Open Items

<!-- Anything in progress, blocked, or deferred. Keep this current. -->

_None yet._

---

## Decisions & Notes

<!-- Architectural calls, library choices, gotchas. Future-Hassan will thank you. -->

_None yet._

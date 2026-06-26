# Sprint 3 — ICS 204, 205, 205A & 206 Form Pages

**Week:** 3
**Payment:** $250
**Status:** Not started

---

## Goal

Build out the next four ICS forms following the exact pattern established in Sprint 2. Each form is structurally similar: shared data auto-populated, form-specific fields, save/load, validation.

---

## Deliverables

### ICS 204 — Assignment List
- [x] Structured form fields for tactical assignments
- [x] Shared data auto-populates (context-wired PDF gen, Prepared By from context)
- [x] Save and load functionality
- [x] Incident info banner

### ICS 205 — Incident Radio Communications Plan
- [x] Structured form fields for radio channels and frequencies
- [x] Shared data auto-populates (context-wired PDF gen)
- [x] Save and load functionality
- [x] Incident info banner

### ICS 205A — Communications List
- [x] Structured form fields for communications contact info (role, name, phone, radio)
- [x] Shared data auto-populates
- [x] Save and load functionality (KV key: `period-${periodId}-comms-contacts`)
- [x] Tab in communications page; separate ICS 205A export button

### ICS 206 — Medical Plan
- [x] Structured form fields for medical aid and transport info
- [x] Shared data auto-populates (context-wired PDF gen)
- [x] Save and load functionality
- [x] Incident info banner

### Validation
- [x] Required field validation before export for all four forms (incidentName + data present)

---

## Success Criteria

- [x] All four forms display correctly with all required fields
- [x] Shared data auto-populates without manual re-entry
- [x] Form data saves and reloads correctly for each form
- [x] Required field validation prevents incomplete exports

---

## Deliverables for Client Review

- ICS 204, 205, 205A, and 206 form walkthrough
- Data persistence verification across all forms

---

## Progress Log

### 2026-05-11 — Sprint 3, Session 1

All four forms completed. ICS 204 (assignments), ICS 205 (radio comms), ICS 205A (comms list), and ICS 206 (medical plan) are now fully wired. Also re-applied the ICS 203 agency representative layout fix that had been reverted.

**Completed this session:**
- Fix: ICS 203 agency rep field-mappings restored to 3-slot, 2-row-per-rep layout (x=146 right-cell, y-pairs 552/538, 524/510, 496/482); white rect pairs updated to match
- ICS 204: incident info banner, context-wired PDF gen (uses `shared.*` instead of re-fetching IAP/periods), pre-export validation
- ICS 205: incident info banner, context-wired PDF gen, pre-export validation; UI cards switched to dark (bg-slate-900) to match other pages
- ICS 205A: new tab in communications page with contacts table (role, name, phone, radio); save/load via `period-${periodId}-comms-contacts`; separate ICS 205A export button
- ICS 206 + ICS 208: incident info banner, both generators context-wired, pre-export validation

---

## Open Items

_None._

---

## Decisions & Notes

- Forms here should reuse the form scaffold/pattern from Sprint 2 (ICS 202/203). If you find yourself writing form-page boilerplate twice, extract a shared component first.

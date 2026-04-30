# Sprint 5 — Cover Page, Weather Integration & Combined IAP Export

**Week:** 5
**Payment:** $250
**Status:** Not started

---

## Goal

Build the IAP cover page, integrate the National Weather Service API, and ship the combined IAP export — the headline feature of the product. By end of sprint, a user can generate a complete merged IAP packet.

---

## Deliverables

### IAP Cover Page
- [ ] Auto-generated cover page
- [ ] Populated with: incident name, op period, prepared by, approved by, agency logo
- [ ] Clean, professional public-safety document styling
- [ ] Only the logo is user-modifiable (no other branding controls)

### Weather Integration
- [ ] National Weather Service API integration (US only, ZIP-code based)
- [ ] Weather data retrieval
- [ ] Formatted weather PDF generation
- [ ] Weather PDF is **optional** but selectable during IAP export

### Combined IAP Export
- [ ] Merge selected forms into one combined PDF in correct assembly order
- [ ] File naming uses incident + period info
- [ ] Pulls shared data from op-period record
- [ ] Pulls form-specific data from each form

### IAP Assembly Order (verify implementation)
1. IAP Cover Page
2. ICS 202 — Incident Objectives
3. ICS 203 — Organization Assignment List
4. ICS 204 — Assignment List
5. ICS 205 — Incident Radio Communications Plan
6. ICS 205A — Communications List
7. ICS 206 — Medical Plan
8. ICS 207 — Incident Organization Chart
9. ICS 208 — Safety Message / Plan
10. Weather PDF (if attached)

---

## Success Criteria

- [ ] Cover page generates correctly with shared data and agency logo
- [ ] Weather API returns forecast and generates a formatted PDF
- [ ] Combined IAP export merges selected forms in correct order
- [ ] Merged PDF is clean, professional, and correctly named

---

## Deliverables for Client Review

- Cover page output sample
- Weather PDF sample
- Combined IAP packet demonstration

---

## Progress Log

_No entries yet._

---

## Open Items

_None yet._

---

## Decisions & Notes

- NWS API is free and keyless but rate-limited and US-only. Document this clearly for the client.
- Weather PDF should fail gracefully if the API is down — never block IAP export.
- Use `pdf-lib` for merging.

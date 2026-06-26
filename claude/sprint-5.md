# Sprint 5 — Cover Page, Weather Integration & Combined IAP Export

**Week:** 5
**Payment:** $250
**Status:** Complete

---

## Goal

Build the IAP cover page, integrate the National Weather Service API, and ship the combined IAP export — the headline feature of the product. By end of sprint, a user can generate a complete merged IAP packet.

---

## Deliverables

### IAP Cover Page
- [x] Auto-generated cover page
- [x] Populated with: incident name, op period, prepared by, approved by, agency logo
- [x] Clean, professional public-safety document styling (navy header, gold accents, signature blocks, IAP contents list)
- [x] Only the logo is user-modifiable (no other branding controls)

### Weather Integration
- [x] National Weather Service API integration (US only, lat/lng based)
- [x] Weather data retrieval (forecast, hourly, alerts)
- [x] Formatted weather PDF generation (shared util: `weather-pdf.ts`)
- [x] Weather PDF is **optional** but selectable during IAP export
- [x] Weather data persisted to KV (`period-{id}-weather`) — survives navigation

### Combined IAP Export
- [x] Merge selected forms into one combined PDF in correct assembly order
- [x] File naming uses incident + period info
- [x] Pulls shared data from op-period record
- [x] Pulls form-specific data from each form

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

- [x] Cover page generates correctly with shared data and agency logo
- [x] Weather API returns forecast and generates a formatted PDF
- [x] Combined IAP export merges selected forms in correct order
- [x] Merged PDF is clean, professional, and correctly named

---

## Deliverables for Client Review

- Cover page output sample
- Weather PDF sample
- Combined IAP packet demonstration

---

## Progress Log

### 2026-05-25 — Sprint 5, Session 1

- Cover page redesigned: navy header bar, gold accents, agency logo top-left, incident name band, two formal signature blocks (Prepared By + Approved By IC), IAP contents list, navy footer bar
- Weather PDF extraction: `src/utils/ics-forms/generators/weather-pdf.ts` created — shared generator used by both the Weather page export button and the IAP Assembly combined export
- Weather persistence: `weather-page.tsx` now saves fetched data to KV key `period-{periodId}-weather` immediately after a successful NWS fetch; loads it back on mount so data survives navigation
- IAP Assembly weather wiring: replaced the "Sprint 5 toast" stub with a real KV load + `generateWeatherPDF()` call; gracefully skips with a warning toast if no weather data has been saved yet
- Sprint 5 deliverables complete.

---

## Open Items

_None._

---

## Decisions & Notes

- NWS API is free and keyless but rate-limited and US-only. Document this clearly for the client.
- Weather PDF should fail gracefully if the API is down — never block IAP export.
- Use `pdf-lib` for merging.

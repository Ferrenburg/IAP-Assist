# Sprint 4 — ICS 207 & 208, PDF Generation Engine & Individual Export

**Week:** 4
**Payment:** $250
**Status:** In progress

---

## Goal

Finish the last two ICS forms (207 and 208) AND build the PDF generation engine using Figma coordinate mappings. By end of sprint, every individual form can be exported as a recognizable, standard-format ICS PDF.

This is the **most technically demanding sprint**. Budget time for the PDF engine.

---

## Deliverables

### ICS 207 — Incident Organization Chart
- [x] Structured form fields for org chart content (uses Personnel page data — no separate form needed)
- [x] Shared data auto-populates (incident name, op period, prepared by from context)
- [x] Save and load functionality (inherits from ICS 203 personnel save/load)
- [x] Export button on Personnel page — generates visual org chart PDF
- [ ] Coordinate calibration — test export and tune `ICS_207_BLOCKS` in field-mappings.ts

### ICS 208 — Safety Message / Plan
- [x] Structured form fields for safety messages (Safety tab on Safety/Medical page)
- [x] Shared data auto-populates
- [x] Save and load functionality
- [x] Export button (Safety/Medical page, Safety tab)
- [x] Overflow → continuation pages when message exceeds one page

### PDF Generation Engine
- [x] Template overlay system using Figma coordinate mappings provided by client
- [x] Data placed at mapped coordinates on standard ICS form layouts
- [x] Output matches recognized ICS form structure
- [x] Reusable across all 8 forms

### Individual Form Export
- [x] Export button on each ICS form page (202, 203, 204, 205, 205A, 206, 207, 208)
- [x] Generates that form as a standalone PDF
- [x] Pulls latest saved shared data + form-specific data
- [x] File naming uses incident and period identifiers

---

## Success Criteria

- [ ] ICS 207 and 208 display correctly with all required fields
- [x] All eight ICS form pages are now complete and functional
- [x] PDF generation engine produces accurate output using coordinate mappings
- [ ] Generated PDFs maintain standard ICS form structure (ICS 207 coordinates need calibration)
- [x] Individual form PDFs can be exported from any form page

---

## Deliverables for Client Review

- ICS 207 and 208 form walkthrough
- PDF output samples for each ICS form
- Coordinate mapping accuracy review

---

## Progress Log

### 2026-05-22 — Sprint 4, Session 1

- Fixed `positionMap` bug in `generateICS207`: empty-string key for Planning Chief corrected to `'Planning Section Chief'`
- Added `handleGenerateICS207` to `personnel-page.tsx` — builds 8 top-level positions from personnel state and calls the generator
- Added ICS 207 export button to Personnel page header alongside ICS 203
- Refactored `generateICS208` for overflow: message now split into wrapped lines, distributed across continuation pages; site safety plan / prepared by / approved by sections always render on the last page only; page numbers added when > 1 page
- ICS 208 `handleGenerateICS208` updated to pass `organizationData` (IC name from shared context) so the Approved By field populates on the PDF
- Added `wrapText` to form-generator imports

---

## Open Items

- ICS 207 coordinate calibration — do a test export with sample data and compare visually against the template. Adjust `ICS_207_BLOCKS` in `field-mappings.ts` as needed.

---

## Decisions & Notes

- **Dependency:** This sprint is blocked on the client providing the Figma coordinate mappings. Confirm they're delivered before sprint start. If not, raise it in Upwork ASAP — placeholder UI is acceptable per the agreement, but PDF generation cannot proceed without coordinates.
- Consider `pdf-lib` for the overlay engine (already in the stack for Sprint 5 merging).

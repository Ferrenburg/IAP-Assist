# Sprint 4 — ICS 207 & 208, PDF Generation Engine & Individual Export

**Week:** 4
**Payment:** $250
**Status:** Not started

---

## Goal

Finish the last two ICS forms (207 and 208) AND build the PDF generation engine using Figma coordinate mappings. By end of sprint, every individual form can be exported as a recognizable, standard-format ICS PDF.

This is the **most technically demanding sprint**. Budget time for the PDF engine.

---

## Deliverables

### ICS 207 — Incident Organization Chart
- [ ] Structured form fields for org chart content
- [ ] Shared data auto-populates
- [ ] Save and load functionality

### ICS 208 — Safety Message / Plan
- [ ] Structured form fields for safety messages and hazards
- [ ] Shared data auto-populates
- [ ] Save and load functionality

### PDF Generation Engine
- [ ] Template overlay system using Figma coordinate mappings provided by client
- [ ] Data placed at mapped coordinates on standard ICS form layouts
- [ ] Output matches recognized ICS form structure
- [ ] Reusable across all 8 forms

### Individual Form Export
- [ ] Export button on each ICS form page
- [ ] Generates that form as a standalone PDF
- [ ] Pulls latest saved shared data + form-specific data
- [ ] File naming uses incident and period identifiers

---

## Success Criteria

- [ ] ICS 207 and 208 display correctly with all required fields
- [ ] All eight ICS form pages are now complete and functional
- [ ] PDF generation engine produces accurate output using coordinate mappings
- [ ] Generated PDFs maintain standard ICS form structure
- [ ] Individual form PDFs can be exported from any form page

---

## Deliverables for Client Review

- ICS 207 and 208 form walkthrough
- PDF output samples for each ICS form
- Coordinate mapping accuracy review

---

## Progress Log

_No entries yet._

---

## Open Items

_None yet._

---

## Decisions & Notes

- **Dependency:** This sprint is blocked on the client providing the Figma coordinate mappings. Confirm they're delivered before sprint start. If not, raise it in Upwork ASAP — placeholder UI is acceptable per the agreement, but PDF generation cannot proceed without coordinates.
- Consider `pdf-lib` for the overlay engine (already in the stack for Sprint 5 merging).

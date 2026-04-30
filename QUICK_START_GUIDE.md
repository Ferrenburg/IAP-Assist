# Quick Start: Adjusting PDF Field Positions

## The One File You Need

Everything is controlled by ONE file:
```
src/utils/ics-forms/field-mappings.ts
```

## Simple 3-Step Process

### 1️⃣ Generate a PDF
- Go to your app's Export page
- Click "Download Full IAP Packet"
- Open the PDF and see what's wrong

### 2️⃣ Find the Field in field-mappings.ts

Look for the form number (202, 203, etc.) and find the field name.

**Example - If ICS 202 incident name is in the wrong spot:**

```typescript
export const ICS_202_BLOCKS = {
  incidentName: { x: 100, y: 740, maxWidth: 320, fontSize: 10 },
  //               ↑        ↑
  //           LEFT/RIGHT  UP/DOWN
```

### 3️⃣ Change the Numbers

- **Move RIGHT**: Increase `x`
- **Move LEFT**: Decrease `x`
- **Move UP**: Increase `y`
- **Move DOWN**: Decrease `y`

```typescript
// Original:
incidentName: { x: 100, y: 740, maxWidth: 320, fontSize: 10 },

// Move 50 points right and 30 points down:
incidentName: { x: 150, y: 710, maxWidth: 320, fontSize: 10 },
```

## That's It!

Save the file, generate a new PDF, and check again. Repeat until it looks right.

---

## Visual Guide

```
PDF Page (letter size: 612 wide × 792 tall)

┌─────────────────────────────────┐ ← y = 792 (TOP)
│                                 │
│                                 │
│                                 │
│     Your text appears here      │
│     at position (x, y)          │
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘ ← y = 0 (BOTTOM)
↑                                 ↑
x = 0                           x = 612
(LEFT)                         (RIGHT)
```

## Common Fields

### ICS 202
- `incidentName` - Incident name at top
- `opPeriodDateFrom` - Start date
- `objectivesStart` - Where objectives begin
- `preparedByName` - Signature at bottom

### ICS 203
- `incidentCommanderName` - IC name
- `safetyOfficerName` - Safety officer name
- `planningChiefName` - Planning chief name

### ICS 204
- `division` - Division field
- `divisionSupervisor` - Supervisor name
- `resourcesTableStart` - Table starting position

### ICS 205
- `radioTableStart` - Radio table position
- `radioColumns.zoneGroup` - Zone column
- `radioColumns.channelName` - Channel name column

### ICS 206
- `aidStationsStart` - Medical aid stations table

### ICS 207
- `orgChart.incidentCommander` - IC box position
- `orgChart.operationsChief` - Operations box position

### ICS 208
- `safetyMessageStart` - Safety message text area

## Example: ICS 202 Incident Name Too Low

**Problem**: Incident name appears too low on the page

**Solution**:
1. Open `src/utils/ics-forms/field-mappings.ts`
2. Find `ICS_202_BLOCKS`
3. Find `incidentName`
4. Current: `{ x: 100, y: 740, ... }`
5. Change to: `{ x: 100, y: 760, ... }` (moved up 20 points)
6. Save, generate PDF, check

## Need More Help?

See the full guide: `HOW_TO_ADJUST_PDF_POSITIONS.md`

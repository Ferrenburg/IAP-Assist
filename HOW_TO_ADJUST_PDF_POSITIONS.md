# How to Adjust Field Positions on PDF Forms

## Simple Overview

When you generate a PDF, text appears at specific X and Y coordinates on the page. If the text is in the wrong place, you need to adjust these coordinates.

## The Coordinate System

PDFs use a coordinate system where:
- **Bottom-left corner** is (0, 0)
- **X** increases going RIGHT
- **Y** increases going UP
- Standard letter page is **612 points wide** × **792 points tall**

```
Top of page:    y = 792
                ↑
                |
                | Y increases
                | going UP
                |
                ↓
Bottom:         y = 0
                
                0 ←--- X increases ---→ 612
```

## Where Field Positions Are Stored

All field positions are in this file:
```
src/utils/ics-forms/field-mappings.ts
```

## How to Find and Change a Position

### Step 1: Find the Form Section

Open `field-mappings.ts` and look for the form you want to change:

```typescript
// For ICS 202:
export const ICS_202_BLOCKS = {
  
// For ICS 203:
export const ICS_203_BLOCKS = {

// etc...
```

### Step 2: Find the Field

Each field has a name and position. For example:

```typescript
export const ICS_202_BLOCKS = {
  // This is the Incident Name field
  incidentName: { x: 100, y: 740, maxWidth: 320, fontSize: 10 },
  
  // This is the start date
  opPeriodDateFrom: { x: 80, y: 715, maxWidth: 80, fontSize: 9 },
}
```

### Step 3: Understand the Field Properties

Each field has these properties:

- **x**: How far from the LEFT edge (in points)
- **y**: How far from the BOTTOM edge (in points)
- **maxWidth**: Maximum width before text gets cut off
- **fontSize**: Size of the text

### Step 4: Adjust the Position

**To move text RIGHT**: Increase `x`
```typescript
// Before:
incidentName: { x: 100, y: 740, maxWidth: 320, fontSize: 10 },

// After (moved 50 points to the right):
incidentName: { x: 150, y: 740, maxWidth: 320, fontSize: 10 },
```

**To move text LEFT**: Decrease `x`
```typescript
// Move 30 points to the left:
incidentName: { x: 70, y: 740, maxWidth: 320, fontSize: 10 },
```

**To move text UP**: Increase `y`
```typescript
// Move 20 points up:
incidentName: { x: 100, y: 760, maxWidth: 320, fontSize: 10 },
```

**To move text DOWN**: Decrease `y`
```typescript
// Move 20 points down:
incidentName: { x: 100, y: 720, maxWidth: 320, fontSize: 10 },
```

## Example: Moving the Incident Name

Let's say you generate a PDF and the incident name is too far left and too high.

### Current Position:
```typescript
incidentName: { x: 100, y: 740, maxWidth: 320, fontSize: 10 },
```

### What You Want:
- Move it 50 points to the RIGHT
- Move it 30 points DOWN

### New Position:
```typescript
incidentName: { x: 150, y: 710, maxWidth: 320, fontSize: 10 },
//                ↑ was 100  ↑ was 740
```

## Quick Reference Table

| To Move... | Change... | Direction |
|------------|-----------|-----------|
| Right      | Increase `x` | + |
| Left       | Decrease `x` | - |
| Up         | Increase `y` | + |
| Down       | Decrease `y` | - |

## Common Fields to Adjust

### ICS 202 (Incident Objectives)
- `incidentName` - Top of form
- `opPeriodDateFrom`, `opPeriodTimeFrom` - Start date/time
- `opPeriodDateTo`, `opPeriodTimeTo` - End date/time
- `objectivesStart` - Where objectives text begins
- `preparedByName` - Footer signature

### ICS 203 (Organization List)
- `incidentCommanderName` - IC name
- `safetyOfficerName` - Safety officer
- `planningChiefName` - Planning section chief
- All the other position names

### ICS 204 (Assignment List)
- `division` - Division field
- `divisionSupervisor` - Supervisor name
- `resourcesTableStart` - Start of resources table
- Table rows automatically space based on `resourceRowHeight`

### ICS 205 (Radio Plan)
- `radioTableStart` - Start of radio table
- `radioColumns` - Each column position (zone, channel, freq, etc.)

## Testing Your Changes

1. Make your coordinate changes in `field-mappings.ts`
2. Save the file
3. Go to the Export page in your app
4. Generate an IAP packet
5. Open the PDF and check if the text is in the right place
6. If not, adjust the coordinates and try again

## Tips

- **Make small changes**: Move by 10-20 points at a time
- **Take notes**: Write down what coordinates you tried
- **Use console logging**: The system logs page dimensions when loading templates
- **Check the PDF viewer**: Open the generated PDF to see actual placement

## Need Help Finding the Right Coordinates?

If you're having trouble, you can:

1. **Enable Debug Mode** - This draws boxes showing where fields are:
   ```typescript
   // In src/utils/ics-forms/debug-mode.ts
   export const DEBUG_MODE = {
     enabled: true,  // Change to true
   ```

2. **Look at console logs** - When generating PDFs, the console shows page dimensions

3. **Start with approximate positions** - You can estimate based on the form layout

## Example Workflow

Let's say the operational period "From" date is appearing too high on ICS 202:

1. **Open**: `src/utils/ics-forms/field-mappings.ts`

2. **Find**: Look for `ICS_202_BLOCKS` section

3. **Locate the field**:
   ```typescript
   opPeriodDateFrom: { x: 80, y: 715, maxWidth: 80, fontSize: 9 },
   ```

4. **Adjust**: The date is too high, so decrease `y`:
   ```typescript
   opPeriodDateFrom: { x: 80, y: 685, maxWidth: 80, fontSize: 9 },
   //                            ↑ moved down 30 points
   ```

5. **Save** the file

6. **Test**: Generate a new PDF and check the position

7. **Repeat**: If still not right, adjust again

That's it! The system is designed so you only need to change numbers in `field-mappings.ts` to move text around on the PDFs.

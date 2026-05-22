/**
 * FEMA ICS Form Field Mappings - RECALIBRATED
 *
 * Coordinate system: Bottom-left origin (0,0)
 * Standard Letter: 612pt width x 792pt height (Portrait)
 * Landscape: 792pt width x 612pt height
 *
 * These coordinates are measured from actual FEMA ICS form PDFs.
 * Each field is anchored to prevent drift into adjacent blocks.
 */

export interface FieldPosition {
  x: number;
  y: number;
  maxWidth?: number;
  maxHeight?: number;
  fontSize?: number;
  font?: "normal" | "bold";
}

export interface BlockMapping {
  [key: string]: FieldPosition;
}

// ICS 202 - Incident Objectives (Portrait: 612 x 792)
export const ICS_202_BLOCKS = {
  // Block 1 - Incident Name (top header)
  incidentName: { x: 40, y: 710, maxWidth: 190, fontSize: 11 },

  // Block 2 - Operational Period (separate fields in header row)
  opPeriodDateFrom: {
    x: 405,
    y: 725,
    maxWidth: 80,
    fontSize: 9,
  },
  opPeriodTimeFrom: {
    x: 405,
    y: 708,
    maxWidth: 60,
    fontSize: 9,
  },
  opPeriodDateTo: { x: 510, y: 725, maxWidth: 70, fontSize: 9 },
  opPeriodTimeTo: { x: 510, y: 708, maxWidth: 70, fontSize: 9 },

  // Block 3 - Objectives (main content area - starts below header)
  objectivesStart: {
    x: 50,
    y: 670,
    maxWidth: 510,
    fontSize: 10,
  },
  objectiveLineHeight: 16,

  // Block 4 - Command Emphasis (separate section)
  commandEmphasisStart: {
    x: 50,
    y: 415,
    maxWidth: 510,
    fontSize: 9,
  },

  // Block 4 - General Situational Awareness (separate section)
  situationalAwarenessStart: {
    x: 50,
    y: 290,
    maxWidth: 510,
    fontSize: 9,
  },

  // Block 5 - Site Safety Plan (checkbox area)
  siteSafetyPlanRequired: { x: 206, y: 227, fontSize: 10 },
  siteSafetyPlanLocation: {
    x: 250,
    y: 210,
    maxWidth: 450,
    fontSize: 9,
  },

  // Block 6 - IAP Attachments (checkbox grid)
  attachmentICS203: { x: 48, y: 179 },
  attachmentICS204: { x: 48, y: 163 },
  attachmentICS205: { x: 48, y: 147 },
  attachmentICS205A: { x: 48, y: 130 },
  attachmentICS206: { x: 48, y: 115 },
  attachmentICS207: { x: 147, y: 179 },
  attachmentICS208: { x: 147, y: 163 },
  attachmentMap: { x: 147, y: 148 },
  attachmentWeather: { x: 147, y: 132 },
  otherAttachments1: {
    x: 367,
    y: 163,
    maxWidth: 200,
    fontSize: 8,
  },
  otherAttachments2: {
    x: 367,
    y: 148,
    maxWidth: 200,
    fontSize: 8,
  },
  otherAttachments3: {
    x: 367,
    y: 133,
    maxWidth: 200,
    fontSize: 8,
  },
  otherAttachments4: {
    x: 367,
    y: 118,
    maxWidth: 200,
    fontSize: 8,
  },

  // Block 7 - Prepared by (footer row)
  preparedByName: { x: 150, y: 96, maxWidth: 100, fontSize: 9 },
  preparedByPosition: {
    x: 323,
    y: 97,
    maxWidth: 95,
    fontSize: 9,
  },
  preparedByDateTime: {
    x: 480,
    y: 97,
    maxWidth: 90,
    fontSize: 9,
  },

  // Block 8 - Approved by IC (footer row)
  approvedByName: { x: 262, y: 80, maxWidth: 100, fontSize: 9 },
  approvedByDateTime: { x: 480, y: 78, maxWidth: 90, fontSize: 9 },
};

// ICS 203 - Organization Assignment List (Portrait: 612 x 792)
export const ICS_203_BLOCKS = {
  // Block 1 - Incident Name
  incidentName: { x: 43, y: 708, maxWidth: 320, fontSize: 10 },

  // Block 2 - Operational Period (combined and separate fields)
  opPeriodFrom: { x: 405, y: 715, maxWidth: 80, fontSize: 9 },
  opPeriodTo: { x: 510, y: 715, maxWidth: 80, fontSize: 9 },
  opPeriodDateFrom: {
    x: 405,
    y: 725,
    maxWidth: 80,
    fontSize: 9,
  },
  opPeriodTimeFrom: {
    x: 405,
    y: 708,
    maxWidth: 60,
    fontSize: 9,
  },
  opPeriodDateTo: { x: 510, y: 725, maxWidth: 70, fontSize: 9 },
  opPeriodTimeTo: { x: 510, y: 708, maxWidth: 70, fontSize: 9 },
  
  // Block 3 - Command Staff (name fields only)
  incidentCommanderName: {
    x: 124,
    y: 675,
    maxWidth: 240,
    fontSize: 8,
  },
  incidentCommanderName2: {
    x: 124,
    y: 660,
    maxWidth: 240,
    fontSize: 8,
  },
  incidentCommanderName3: {
    x: 124,
    y: 645,
    maxWidth: 240,
    fontSize: 8,
  },
  deputyICName: { x: 124, y: 630, maxWidth: 155, fontSize: 8 },
  safetyOfficerName: {
    x: 124,
    y: 615,
    maxWidth: 240,
    fontSize: 8,
  },
  publicInfoOfficerName: {
    x: 124,
    y: 600,
    maxWidth: 240,
    fontSize: 8,
  },
  liaisonOfficerName: {
    x: 124,
    y: 585,
    maxWidth: 240,
    fontSize: 8,
  },

  // Block 4 - Agency Representatives
  // The template has 6 data rows at 14pt intervals starting at y=552.
  // Left column (Agency/Organization): x=43, right column (Name): x=146.
  // Both columns share the same y per rep (single-row-per-rep layout).
  agencyRep1Agency: { x: 43,  y: 538, maxWidth: 96,  fontSize: 8 },
  agencyRep1Name:   { x: 146, y: 538, maxWidth: 135, fontSize: 8 },
  agencyRep2Agency: { x: 43,  y: 524, maxWidth: 96,  fontSize: 8 },
  agencyRep2Name:   { x: 146, y: 524, maxWidth: 135, fontSize: 8 },
  agencyRep3Agency: { x: 43,  y: 510, maxWidth: 96,  fontSize: 8 },
  agencyRep3Name:   { x: 146, y: 510, maxWidth: 135, fontSize: 8 },
  agencyRep4Agency: { x: 43,  y: 496, maxWidth: 96,  fontSize: 8 },
  agencyRep4Name:   { x: 146, y: 496, maxWidth: 135, fontSize: 8 },
  agencyRep5Agency: { x: 43,  y: 482, maxWidth: 96,  fontSize: 8 },
  agencyRep5Name:   { x: 146, y: 482, maxWidth: 135, fontSize: 8 },
  agencyRep6Agency: { x: 43,  y: 468, maxWidth: 96,  fontSize: 8 },
  agencyRep6Name:   { x: 146, y: 468, maxWidth: 135, fontSize: 8 },

  // Block 5 - Planning Section
  planningChiefName: {
    x: 146,
    y: 432,
    maxWidth: 240,
    fontSize: 8,
  },
  planningDeputyName: {
    x: 146,
    y: 416,
    maxWidth: 240,
    fontSize: 8,
  },
  resourcesUnitName: {
    x: 146,
    y: 401,
    maxWidth: 240,
    fontSize: 8,
  },
  situationUnitName: {
    x: 146,
    y: 388,
    maxWidth: 240,
    fontSize: 8,
  },
  documentationUnitName: {
    x: 146,
    y: 372,
    maxWidth: 240,
    fontSize: 8,
  },
  demobilizationUnitName: {
    x: 146,
    y: 357,
    maxWidth: 240,
    fontSize: 8,
  },
  technicalSpecialist1Name: {
    x: 146,
    y: 343,
    maxWidth: 240,
    fontSize: 8,
  },
  technicalSpecialist2Name: {
    x: 146,
    y: 327,
    maxWidth: 240,
    fontSize: 8,
  },
  technicalSpecialist3Name: {
    x: 146,
    y: 312,
    maxWidth: 240,
    fontSize: 8,
  },
  technicalSpecialist4Name: {
    x: 146,
    y: 298,
    maxWidth: 240,
    fontSize: 8,
  },

  // Block 6 - Logistics Section
  logisticsChiefName: {
    x: 146,
    y: 265,
    maxWidth: 240,
    fontSize: 8,
  },
  logisticsDeputyName: {
    x: 146,
    y: 250,
    maxWidth: 240,
    fontSize: 8,
  },
  supportBranchName: {
    x: 146,
    y: 221,
    maxWidth: 240,
    fontSize: 8,
  },
  supplyUnitName: {
    x: 146,
    y: 206,
    maxWidth: 220,
    fontSize: 8,
  },
  facilitiesUnitName: {
    x: 146,
    y: 189,
    maxWidth: 220,
    fontSize: 8,
  },
  groundSupportUnitName: {
    x: 146,
    y: 174,
    maxWidth: 220,
    fontSize: 8,
  },
  serviceBranchName: {
    x: 146,
    y: 144,
    maxWidth: 240,
    fontSize: 8,
  },
  communicationsUnitName: {
    x: 146,
    y: 129,
    maxWidth: 220,
    fontSize: 8,
  },
  medicalUnitName: {
    x: 146,
    y: 114,
    maxWidth: 220,
    fontSize: 8,
  },
  foodUnitName: {
    x: 146,
    y: 100,
    maxWidth: 220,
    fontSize: 8,
  },

  // Block 7 - Operations Section
  operationsChiefName: {
    x: 385,
    y: 674,
    maxWidth: 240,
    fontSize: 8,
  },
  operationsDeputyName: {
    x: 385,
    y: 659,
    maxWidth: 240,
    fontSize: 8,
  },
  stagingAreaName: {
    x: 385,
    y: 630,
    maxWidth: 240,
    fontSize: 8,
  },
  airOpsBranchDirectorName: {
    x: 385,
    y: 236,
    maxWidth: 220,
    fontSize: 8,
  },

  // Branch/Division/Group Table (dynamic section)
  branchTableStart: {
    branchNameX: 385,
    branches: [
      { nameY: 615, directorY: 600, firstDivisionY: 569 },  // Branch 1
      { nameY: 493, directorY: 478, firstDivisionY: 447 },  // Branch 2
      { nameY: 372, directorY: 357, firstDivisionY: 326 },  // Branch 3
    ],
    branchDirectorX: 386,
    divisionLabelX: 386,
    divisionSupervisorX: 482,
    fontSize: 8,
    divisionRowHeight: 13,
    maxBranchesPerPage: 3,
    labelMaxWidth: 90,
    supervisorMaxWidth: 140,
  },

  // Block 8 - Finance/Admin Section
  financeChiefName: {
    x: 385,
    y: 173,
    maxWidth: 240,
    fontSize: 8,
  },
  financeDeputyName: {
    x: 385,
    y: 158,
    maxWidth: 240,
    fontSize: 8,
  },
  timeUnitName: {
    x: 385, 
    y: 144, 
    maxWidth: 220, 
    fontSize: 8 },
  procurementUnitName: {
    x: 385,
    y: 130,
    maxWidth: 220,
    fontSize: 8,
  },
  compClaimsUnitName: {
    x: 385,
    y: 114,
    maxWidth: 220,
    fontSize: 8,
  },
  costUnitName: {
    x: 385,
    y: 99,
    maxWidth: 220,
    fontSize: 8,
  },

  // Block 9 - Prepared by (footer)
  preparedByName: { x: 155, y: 84, maxWidth: 180, fontSize: 9 },
  preparedByPosition: {
    x: 324,
    y: 84,
    maxWidth: 140,
    fontSize: 9,
  },
  preparedByDateTime: {
    x: 312,
    y: 65,
    maxWidth: 90,
    fontSize: 9,
  },
};

// ICS 204 - Assignment List (Portrait: 612 x 792)
export const ICS_204_BLOCKS = {
  // Block 1 - Incident Name (top header, right side)
  incidentName: { x: 39, y: 708, maxWidth: 200, fontSize: 9 },

  // IAP Page number (top-right header cell)
  iapPageNumber: { x: 560, y: 725, maxWidth: 40, fontSize: 9 },

   // Block 2 - Operational Period (separate fields in header row)
  opPeriodDateFrom: {
    x: 250,
    y: 707,
    maxWidth: 80,
    fontSize: 9,
  },
  opPeriodTimeFrom: {
    x: 251,
    y: 691,
    maxWidth: 60,
    fontSize: 9,
  },
  opPeriodDateTo: { x: 378, y: 707, maxWidth: 70, fontSize: 9 },
  opPeriodTimeTo: { x: 378, y: 691, maxWidth: 70, fontSize: 9 },

  // Block 3 - Branch/Division/Group/Staging Area (separate header fields)
  branch: { x: 489, y: 703, maxWidth: 100, fontSize: 9 },
  division: { x: 494, y: 677, maxWidth: 100, fontSize: 9 },
  group: { x: 484, y: 653, maxWidth: 100, fontSize: 9 },
  stagingArea: { x: 516, y: 629, maxWidth: 70, fontSize: 9 },
  reportingLocation: { x: 448, y: 607, maxWidth: 100, fontSize: 9 },

  // Block 4 - Operations Personnel (name/contact pairs)
  opsSectionChief: {
    x: 168,
    y: 656,
    maxWidth: 130,
    fontSize: 8,
  },
  opsSectionChiefContact: {
    x: 355,
    y: 656,
    maxWidth: 90,
    fontSize: 8,
  },
  branchDirector: {
    x: 168,
    y: 633,
    maxWidth: 130,
    fontSize: 8,
  },
  branchDirectorContact: {
    x: 355,
    y: 633,
    maxWidth: 90,
    fontSize: 8,
  },
  divisionSupervisor: {
    x: 168,
    y: 609,
    maxWidth: 130,
    fontSize: 8,
  },
  divisionSupervisorContact: {
    x: 355,
    y: 609,
    maxWidth: 90,
    fontSize: 8,
  },

  // Block 5 - Resources Assigned (table starts below operations personnel)
  resourcesTableStart: { x: 39, y: 542, fontSize: 7 },
  resourceRowHeight: 15,
  resourceColumns: {
    identifier: { x: 39, maxWidth: 100 },
    leader: { x: 144, maxWidth: 100 },
    numPersons: { x: 245, maxWidth: 30 },
    contact: { x: 282, maxWidth: 160 },
    notes: { x: 446, maxWidth: 125 },
  },

  // Block 6 - Work Assignments (text area)
  workAssignmentsStart: {
    x: 45,
    y: 369,
    maxWidth: 510,
    fontSize: 9,
  },

  // Block 7 - Special Instructions (text area)
  specialInstructionsStart: {
    x: 45,
    y: 240,
    maxWidth: 510,
    fontSize: 8,
  },

  // Block 8 - Communications table (3 columns matching the pre-printed template)
  communicationsStart: {
    x: 45,
    y: 152,
    maxWidth: 510,
    fontSize: 8,
  },
  commColumns: {
    function: { x: 45,  maxWidth: 100 },  // Function/Role column
    name:     { x: 175, maxWidth: 100 },  // Name column (after the "/" separator)
    contact:  { x: 310, maxWidth: 240 },  // Contact Number/Frequency column
  },
  commLineHeight: 14,

  // Block 9 - Prepared by (footer)
  preparedByName: { x: 157, y: 86, maxWidth: 180, fontSize: 9 },
  preparedByPosition: {
    x: 322,
    y: 86,
    maxWidth: 140,
    fontSize: 9,
  },
  preparedByDateTime: {
    x: 310,
    y: 69,
    maxWidth: 90,
    fontSize: 9,
  },
};

// ICS 205 - Radio Communications Plan (Landscape: 792 x 612)
export const ICS_205_BLOCKS = {
  // ICS 205 is landscape format with 90-degree rotation in template
  // For row-based table rendering, rows go down the page (x increases)
  // Block 1 - Incident Name
  incidentName: { x: 98, y: 40, maxWidth: 400, fontSize: 9 },

  // Block 2 - Date/Time Prepared (split into two lines)
  dateTimePrepared: {
    date: { x: 84, y: 297, fontSize: 8 },
    time: { x: 100, y: 297, fontSize: 8 },
  },

  // Block 3 - Operational Period (split into two lines each)
  opPeriodFrom: {
    date: { x: 84, y: 566, fontSize: 8 },
    time: { x: 100, y: 566, fontSize: 8 },
  },
  opPeriodTo: {
    date: { x: 84, y: 670, fontSize: 8 },
    time: { x: 100, y: 670, fontSize: 8 },
  },

  // Block 4 - Radio Communications Table (row-based)
  // Each row is horizontal across the form, columns are the different fields
  radioTableStart: { x: 184, fontSize: 7 },
  radioRowHeight: 32, // Distance between rows
  radioColumns: {
    // y coordinates for each column within a row
    zoneGroup: { y: 38, maxWidth: 28 },
    channelNumber: { y: 68, maxWidth: 20 },
    function: { y: 91, maxWidth: 82 },
    channelName: { y: 180, maxWidth: 92 },
    assignment: { y: 276, maxWidth: 60 },
    rxFreq: { y: 340, maxWidth: 40 },
    rxTone: { y: 384, maxWidth: 50 },
    txFreq: { y: 438, maxWidth: 40 },
    txTone: { y: 484, maxWidth: 50 },
    mode: { y: 537, maxWidth: 55 },
    remarks: { y: 596, maxWidth: 155 },
  },

  // Block 5 - Special Instructions
  specialInstructionsStart: {
    x: 445,
    y: 42,
    maxWidth: 120,
    fontSize: 8,
  },

  // Block 6 - Prepared by
  preparedByName: { x: 534, y: 295, maxWidth: 230, fontSize: 9 },
  preparedByDateTime: {
    date: { x: 554, y: 392, fontSize: 9 },
    time: { x: 554, y: 472, fontSize: 9 },
  },
};

// ICS 205A - Communications List (Portrait: 612 x 792)
export const ICS_205A_BLOCKS = {
  // Block 1 - Incident Name
  // Block 1 cell bottom border sits at y≈706; cell top is around y≈735.
  // y=712 keeps the text 6pt above the bottom border so it doesn't sit ON the border line.
  incidentName: { x: 43, y: 712, maxWidth: 240, fontSize: 9 },

  // Block 2 - Operational Period (split date/time rows, right half of header)
  // Pre-printed "Date From:" / "Date To:" label baseline sits at y≈725 (bracketed: 720<y<730).
  // Pre-printed "Time From:" / "Time To:" label baseline sits at y≈712 (bracketed: 706<y<718).
  // x=405 mirrors ICS 202 (same header structure, confirmed working): fill area for "Date From:"
  // starts right after the bold "Date From:" label ends (~x:402).
  // x=510 mirrors ICS 202's "Date To:" fill area start.
  opPeriodDateFrom: { x: 405, y: 725, maxWidth: 70, fontSize: 8 },
  opPeriodTimeFrom: { x: 405, y: 712, maxWidth: 70, fontSize: 8 },
  opPeriodDateTo:   { x: 510, y: 725, maxWidth: 60, fontSize: 8 },
  opPeriodTimeTo:   { x: 510, y: 712, maxWidth: 60, fontSize: 8 },

  // Block 3 - Communications Table
  // Template grid lines are at y=663, 649, 635, ... (14pt pitch). First data row spans y=649–663.
  // y=656 puts the text baseline in the vertical center of the first row.
  commTableStart: { x: 50, y: 656, fontSize: 8 },
  commRowHeight: 14,
  commColumns: {
    position: { x: 40,  maxWidth: 150 },
    name:     { x: 195, maxWidth: 140 },
    method:   { x: 340, maxWidth: 210 },
  },

  // Block 4 - Prepared by (footer)
  // "4. Prepared by: Name: __ Position/Title: __ Signature: __" row baseline ≈ y=113
  // "ICS 205A | IAP Page __ | Date/Time: __" row (below) baseline ≈ y=92
  preparedByName: { x: 155, y: 113, maxWidth: 165, fontSize: 9 },
  preparedByPosition: { x: 345, y: 113, maxWidth: 140, fontSize: 9 },
  preparedByDateTime: { x: 345, y: 92, maxWidth: 230, fontSize: 9 },
};

// ICS 206 - Medical Plan (Landscape: 792 x 612)
export const ICS_206_BLOCKS = {
  // Block 1 - Incident Name
  incidentName: { x: 40, y: 711, maxWidth: 400, fontSize: 9 },

  // Block 2 - Operational Period (split into two lines each)
  opPeriodFrom: {
    date: { x: 410, y: 724, fontSize: 8 },
    time: { x: 410, y: 713, fontSize: 8 },
  },
  opPeriodTo: {
    date: { x: 513, y: 724, fontSize: 8 },
    time: { x: 513, y: 713, fontSize: 8 },
  },

  // Block 3 - Medical Aid Stations (table)
  aidStationsStart: { x: 38, y: 652, fontSize: 10 },
  aidStationRowHeight: 16,
  aidStationColumns: {
    name: { x: 37, maxWidth: 125 },
    location: { x: 167, maxWidth: 190 },
    contact: { x: 370, maxWidth: 140 },
    paramedicsYes: { x: 498 },
    paramedicsNo: { x: 536 },
  },

  // Block 4 - Transportation (table - must stay BELOW aid stations)
  transportationStart: { x: 38, y: 508, fontSize: 10 },
  transportationRowHeight: 16,
  transportationColumns: {
    service: { x: 38, maxWidth: 140 },
    location: { x: 166, maxWidth: 190 },
    contact: { x: 363, maxWidth: 115 },
    levelALS: { x: 496 },
    levelBLS: { x: 533 },
  },

  // Block 5 - Hospitals (table - must stay BELOW transportation)
  hospitalsStart: { x: 38, y: 368, fontSize: 8 },
  hospitalRowHeight: 30,
  hospitalColumns: {
    name: { x: 38, maxWidth: 80 },
    address: { x: 119, maxWidth: 120 },
    contact: { x: 241, maxWidth: 80 },
    airTime: { x: 327, maxWidth: 40 },
    groundTime: { x: 372, maxWidth: 40 },
    traumaCenterYes: { x: 420, yOffset: 16 },
    traumaCenterLevel: { x: 454, yOffset: 6,  maxWidth: 20 },
    burnCenterYes: { x: 488, yOffset: 16 },
    burnCenterNo: { x: 488, yOffset: 3 },
    helipadYes: { x: 534, yOffset: 16 },
    helipadNo: { x: 534, yOffset: 3 },
  },

  // Block 6 - Special Procedures (text area)
  specialProceduresStart: {
    x: 43,
    y: 208,
    maxWidth: 690,
    fontSize: 8,
  },

  // Block 7 - Prepared by (footer)
  preparedByName: { x: 254, y: 94, maxWidth: 180, fontSize: 9 },
  preparedByPosition: { x: 440, y: 94, maxWidth: 140, fontSize: 9 },

  // Block 8 - Approved by (footer)
  approvedByName: { x: 299, y: 75, maxWidth: 230, fontSize: 9 },
};

// ICS 207 - Organization Chart (Landscape: 792 x 612)
// ICS 207 - Incident Organization Chart (Landscape: 792 x 612)
export const ICS_207_BLOCKS = {
  // Block 1 - Incident Name (left ~38% of header row)
  incidentName: { x: 120, y: 590, maxWidth: 185, fontSize: 9 },

  // Block 2 - Operational Period (right portion of header, two rows)
  opPeriodFrom: {
    date: { x: 447, y: 590, fontSize: 8 },
    time: { x: 447, y: 568, fontSize: 8 },
  },
  opPeriodTo: {
    date: { x: 578, y: 590, fontSize: 8 },
    time: { x: 578, y: 568, fontSize: 8 },
  },

  // Block 3 - Organization Chart (names go in lower portion of each printed box)
  orgChart: {
    incidentCommander:  { x: 340, y: 437, maxWidth: 120, fontSize: 8 },  // center-top
    liaisonOfficer:     { x: 548, y: 462, maxWidth: 90,  fontSize: 7 },  // upper right
    safetyOfficer:      { x: 548, y: 408, maxWidth: 90,  fontSize: 7 },  // right, below liaison
    publicInfoOfficer:  { x: 548, y: 358, maxWidth: 90,  fontSize: 7 },  // right, below safety
    operationsChief:    { x: 196, y: 400, maxWidth: 120, fontSize: 8 },  // left side
    planningChief:      { x: 444, y: 282, maxWidth: 100, fontSize: 8 },  // center lower
    logisticsChief:     { x: 560, y: 282, maxWidth: 100, fontSize: 8 },  // center-right lower
    financeChief:       { x: 678, y: 282, maxWidth:  95, fontSize: 8 },  // far right lower
  },

  // Block 4 - Prepared by (bottom footer strip)
  preparedByName:     { x: 185, y: 22, maxWidth: 140, fontSize: 9 },
  preparedByPosition: { x: 358, y: 22, maxWidth: 130, fontSize: 9 },
  preparedByDateTime: { x: 625, y: 22, maxWidth: 130, fontSize: 9 },
};

// ICS 208 - Safety Message/Plan (Portrait: 612 x 792)
export const ICS_208_BLOCKS = {
  // Block 1 - Incident Name (top header)
  incidentName: { x: 43, y: 707, maxWidth: 320, fontSize: 10 },

  // Block 2 - Operational Period (split into two lines each)
  opPeriodFrom: {
    date: { x: 402, y: 724, fontSize: 9 },
    time: { x: 402, y: 708, fontSize: 9 },
  },
  opPeriodTo: {
    date: { x: 505, y: 724, fontSize: 9 },
    time: { x: 505, y: 708, fontSize: 9 },
  },

  // Block 3 - Safety Message/Expanded Safety Message (main content area)
  safetyMessageStart: {
    x: 50,
    y: 670,
    maxWidth: 510,
    fontSize: 9,
  },
  safetyLineHeight: 16,

  // Block 4 - Site Safety Plan Required (checkbox area - lower section)
  siteSafetyPlanRequired: { x: 206, y: 114, fontSize: 10 },
  siteSafetyPlanLocation: {
    x: 249,
    y: 99,
    maxWidth: 450,
    fontSize: 9,
  },

  // Block 5 - Prepared by (footer)
  preparedByName: { x: 155, y: 81, maxWidth: 180, fontSize: 9 },
  preparedByPosition: {
    x: 324,
    y: 81,
    maxWidth: 140,
    fontSize: 9,
  },
  preparedByDateTime: {
    x: 314,
    y: 63,
    maxWidth: 90,
    fontSize: 9,
  },

  // Block 6 - Approved by (footer)
  approvedByName: { x: 100, y: 55, maxWidth: 180, fontSize: 9 },
};
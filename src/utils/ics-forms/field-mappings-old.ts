/**
 * FEMA ICS Form Field Mappings
 * Each form is broken down into numbered blocks with exact field positions
 */

export interface FieldPosition {
  x: number;
  y: number;
  maxWidth?: number;
  maxHeight?: number;
  fontSize?: number;
  font?: 'normal' | 'bold';
}

export interface BlockMapping {
  [key: string]: FieldPosition;
}

// ICS 202 - Incident Objectives
export const ICS_202_BLOCKS = {
  // Block 1 - Incident Name
  incidentName: { x: 110, y: 717, maxWidth: 280, fontSize: 10 },

  // Block 2 - Operational Period
  opPeriodDateFrom: { x: 110, y: 692, fontSize: 9 },
  opPeriodTimeFrom: { x: 210, y: 692, fontSize: 9 },
  opPeriodDateTo: { x: 310, y: 692, fontSize: 9 },
  opPeriodTimeTo: { x: 410, y: 692, fontSize: 9 },

  // Block 3 - Objectives (main content area)
  objectivesStart: { x: 50, y: 655, maxWidth: 520, fontSize: 10 },
  objectiveLineHeight: 18,

  // Block 4 - Operational Period Command Emphasis
  commandEmphasisStart: { x: 50, y: 370, maxWidth: 520, fontSize: 9 },

  // Block 4 - General Situational Awareness
  situationalAwarenessStart: { x: 50, y: 280, maxWidth: 520, fontSize: 9 },

  // Block 5 - Site Safety Plan
  siteSafetyPlanRequired: { x: 285, y: 195, fontSize: 10 }, // Yes/No checkbox area
  siteSafetyPlanLocation: { x: 110, y: 175, maxWidth: 450, fontSize: 9 },

  // Block 6 - IAP Attachments (checkboxes)
  attachmentICS203: { x: 55, y: 155 },
  attachmentICS204: { x: 55, y: 140 },
  attachmentICS205: { x: 165, y: 155 },
  attachmentICS205A: { x: 165, y: 140 },
  attachmentICS206: { x: 275, y: 155 },
  attachmentICS207: { x: 275, y: 140 },
  attachmentICS208: { x: 385, y: 155 },
  attachmentMap: { x: 385, y: 140 },
  attachmentWeather: { x: 495, y: 155 },
  otherAttachments: { x: 110, y: 125, maxWidth: 450, fontSize: 8 },

  // Block 7 - Prepared by
  preparedByName: { x: 110, y: 95, maxWidth: 200, fontSize: 9 },
  preparedByPosition: { x: 320, y: 95, maxWidth: 150, fontSize: 9 },
  preparedByDateTime: { x: 480, y: 95, fontSize: 9 },

  // Block 8 - Approved by IC
  approvedByName: { x: 110, y: 65, maxWidth: 200, fontSize: 9 },
  approvedByDateTime: { x: 480, y: 65, fontSize: 9 },
};

// ICS 203 - Organization Assignment List
export const ICS_203_BLOCKS = {
  // Block 1 - Incident Name
  incidentName: { x: 110, y: 717, maxWidth: 280, fontSize: 10 },

  // Block 2 - Operational Period
  opPeriodFrom: { x: 110, y: 692, fontSize: 9 },
  opPeriodTo: { x: 310, y: 692, fontSize: 9 },

  // Block 3 - Command Staff
  incidentCommanderName: { x: 280, y: 665, maxWidth: 250, fontSize: 8 },
  deputyICName: { x: 280, y: 650, maxWidth: 250, fontSize: 8 },
  safetyOfficerName: { x: 280, y: 635, maxWidth: 250, fontSize: 8 },
  publicInfoOfficerName: { x: 280, y: 620, maxWidth: 250, fontSize: 8 },
  liaisonOfficerName: { x: 280, y: 605, maxWidth: 250, fontSize: 8 },

  // Block 4 - Agency Representatives
  agencyRepsStart: { x: 50, y: 575, fontSize: 8 },
  agencyRepLineHeight: 15,

  // Block 5 - Planning Section
  planningChiefName: { x: 280, y: 500, maxWidth: 250, fontSize: 8 },
  planningDeputyName: { x: 280, y: 485, maxWidth: 250, fontSize: 8 },
  resourcesUnitName: { x: 280, y: 470, maxWidth: 250, fontSize: 8 },
  situationUnitName: { x: 280, y: 455, maxWidth: 250, fontSize: 8 },
  documentationUnitName: { x: 280, y: 440, maxWidth: 250, fontSize: 8 },
  demobilizationUnitName: { x: 280, y: 425, maxWidth: 250, fontSize: 8 },

  // Block 6 - Logistics Section
  logisticsChiefName: { x: 280, y: 380, maxWidth: 250, fontSize: 8 },
  logisticsDeputyName: { x: 280, y: 365, maxWidth: 250, fontSize: 8 },
  supportBranchName: { x: 280, y: 350, maxWidth: 250, fontSize: 8 },
  serviceBranchName: { x: 280, y: 335, maxWidth: 250, fontSize: 8 },

  // Block 7 - Operations Section
  operationsChiefName: { x: 280, y: 265, maxWidth: 250, fontSize: 8 },
  operationsDeputyName: { x: 280, y: 250, maxWidth: 250, fontSize: 8 },
  stagingAreaName: { x: 280, y: 235, maxWidth: 250, fontSize: 8 },
  divisionsStart: { x: 50, y: 220, fontSize: 8 },
  divisionLineHeight: 15,

  // Block 8 - Finance/Admin Section
  financeChiefName: { x: 280, y: 140, maxWidth: 250, fontSize: 8 },
  financeDeputyName: { x: 280, y: 125, maxWidth: 250, fontSize: 8 },
  timeUnitName: { x: 280, y: 110, maxWidth: 250, fontSize: 8 },
  procurementUnitName: { x: 280, y: 95, maxWidth: 250, fontSize: 8 },

  // Block 9 - Prepared by
  preparedByName: { x: 110, y: 65, maxWidth: 200, fontSize: 9 },
  preparedByPosition: { x: 320, y: 65, maxWidth: 150, fontSize: 9 },
  preparedByDateTime: { x: 480, y: 65, fontSize: 9 },
};

// ICS 204 - Assignment List
export const ICS_204_BLOCKS = {
  // Block 1 - Incident Name
  incidentName: { x: 170, y: 739, maxWidth: 200, fontSize: 9 },

  // Block 2 - Operational Period
  opPeriodFrom: { x: 170, y: 720, fontSize: 8 },
  opPeriodTo: { x: 370, y: 720, fontSize: 8 },

  // Block 3 - Branch/Division/Group
  branch: { x: 100, y: 700, maxWidth: 120, fontSize: 9 },
  division: { x: 270, y: 700, maxWidth: 120, fontSize: 9 },
  group: { x: 440, y: 700, maxWidth: 100, fontSize: 9 },

  // Block 4 - Operations Personnel
  opsSectionChief: { x: 280, y: 675, maxWidth: 150, fontSize: 8 },
  opsSectionChiefContact: { x: 480, y: 675, fontSize: 8 },
  branchDirector: { x: 280, y: 660, maxWidth: 150, fontSize: 8 },
  branchDirectorContact: { x: 480, y: 660, fontSize: 8 },
  divisionSupervisor: { x: 280, y: 645, maxWidth: 150, fontSize: 8 },
  divisionSupervisorContact: { x: 480, y: 645, fontSize: 8 },

  // Block 5 - Resources Assigned (table)
  resourcesTableStart: { x: 50, y: 610, fontSize: 7 },
  resourceRowHeight: 20,
  resourceColumns: {
    identifier: { x: 50, maxWidth: 80 },
    leader: { x: 135, maxWidth: 80 },
    numPersons: { x: 220, maxWidth: 30 },
    contact: { x: 255, maxWidth: 80 },
    notes: { x: 340, maxWidth: 220 },
  },

  // Block 6 - Work Assignments
  workAssignmentsStart: { x: 50, y: 320, maxWidth: 520, fontSize: 9 },

  // Block 7 - Special Instructions
  specialInstructionsStart: { x: 50, y: 230, maxWidth: 520, fontSize: 8 },

  // Block 8 - Communications
  communicationsStart: { x: 50, y: 140, fontSize: 8 },
  commLineHeight: 15,

  // Block 9 - Prepared by
  preparedByName: { x: 110, y: 65, maxWidth: 200, fontSize: 9 },
  preparedByPosition: { x: 320, y: 65, maxWidth: 150, fontSize: 9 },
  preparedByDateTime: { x: 480, y: 65, fontSize: 9 },
};

// ICS 205 - Radio Communications Plan
export const ICS_205_BLOCKS = {
  // Block 1 - Incident Name
  incidentName: { x: 110, y: 547, maxWidth: 450, fontSize: 9 },

  // Block 2 - Date/Time Prepared
  dateTimePrepared: { x: 670, y: 547, fontSize: 8 },

  // Block 3 - Operational Period
  opPeriodFrom: { x: 110, y: 527, fontSize: 8 },
  opPeriodTo: { x: 400, y: 527, fontSize: 8 },

  // Block 4 - Radio Communications Table
  radioTableStart: { x: 30, y: 500, fontSize: 7 },
  radioRowHeight: 18,
  radioColumns: {
    zoneGroup: { x: 30, maxWidth: 45 },
    channelNumber: { x: 80, maxWidth: 40 },
    function: { x: 125, maxWidth: 60 },
    channelName: { x: 190, maxWidth: 90 },
    assignment: { x: 285, maxWidth: 80 },
    rxFreq: { x: 370, maxWidth: 60 },
    rxTone: { x: 435, maxWidth: 50 },
    txFreq: { x: 490, maxWidth: 60 },
    txTone: { x: 555, maxWidth: 50 },
    mode: { x: 610, maxWidth: 35 },
    remarks: { x: 650, maxWidth: 110 },
  },

  // Block 5 - Special Instructions
  specialInstructionsStart: { x: 50, y: 140, maxWidth: 710, fontSize: 8 },

  // Block 6 - Prepared by
  preparedByName: { x: 200, y: 65, maxWidth: 250, fontSize: 9 },
  preparedByDateTime: { x: 600, y: 65, fontSize: 9 },
};

// ICS 205A - Communications List
export const ICS_205A_BLOCKS = {
  // Block 1 - Incident Name
  incidentName: { x: 110, y: 717, maxWidth: 280, fontSize: 10 },

  // Block 2 - Operational Period
  opPeriodFrom: { x: 110, y: 692, fontSize: 9 },
  opPeriodTo: { x: 310, y: 692, fontSize: 9 },

  // Block 3 - Communications Table
  commTableStart: { x: 50, y: 660, fontSize: 8 },
  commRowHeight: 20,
  commColumns: {
    position: { x: 50, maxWidth: 150 },
    name: { x: 205, maxWidth: 150 },
    method: { x: 360, maxWidth: 200 },
  },

  // Block 4 - Prepared by
  preparedByName: { x: 110, y: 65, maxWidth: 200, fontSize: 9 },
  preparedByPosition: { x: 320, y: 65, maxWidth: 150, fontSize: 9 },
  preparedByDateTime: { x: 480, y: 65, fontSize: 9 },
};

// ICS 206 - Medical Plan
export const ICS_206_BLOCKS = {
  // Block 1 - Incident Name
  incidentName: { x: 110, y: 547, maxWidth: 450, fontSize: 9 },

  // Block 2 - Operational Period
  opPeriodFrom: { x: 110, y: 527, fontSize: 8 },
  opPeriodTo: { x: 400, y: 527, fontSize: 8 },

  // Block 3 - Medical Aid Stations
  aidStationsStart: { x: 30, y: 495, fontSize: 7 },
  aidStationRowHeight: 18,
  aidStationColumns: {
    name: { x: 30, maxWidth: 150 },
    location: { x: 185, maxWidth: 200 },
    contact: { x: 390, maxWidth: 150 },
    paramedics: { x: 545, maxWidth: 50 },
  },

  // Block 4 - Transportation
  transportationStart: { x: 30, y: 380, fontSize: 7 },
  transportationRowHeight: 18,
  transportationColumns: {
    service: { x: 30, maxWidth: 150 },
    location: { x: 185, maxWidth: 150 },
    contact: { x: 340, maxWidth: 130 },
    level: { x: 475, maxWidth: 50 },
  },

  // Block 5 - Hospitals
  hospitalsStart: { x: 30, y: 270, fontSize: 6 },
  hospitalRowHeight: 16,
  hospitalColumns: {
    name: { x: 30, maxWidth: 120 },
    address: { x: 155, maxWidth: 140 },
    contact: { x: 300, maxWidth: 100 },
    airTime: { x: 405, maxWidth: 35 },
    groundTime: { x: 445, maxWidth: 35 },
    traumaCenter: { x: 485, maxWidth: 40 },
    burnCenter: { x: 530, maxWidth: 30 },
    helipad: { x: 565, maxWidth: 30 },
  },

  // Block 6 - Special Procedures
  specialProceduresStart: { x: 50, y: 140, maxWidth: 710, fontSize: 8 },

  // Block 7 - Prepared by
  preparedByName: { x: 200, y: 90, maxWidth: 250, fontSize: 9 },
  preparedByDateTime: { x: 600, y: 90, fontSize: 9 },

  // Block 8 - Approved by
  approvedByName: { x: 200, y: 65, maxWidth: 250, fontSize: 9 },
  approvedByDateTime: { x: 600, y: 65, fontSize: 9 },
};

// ICS 207 - Organization Chart
export const ICS_207_BLOCKS = {
  // Block 1 - Incident Name
  incidentName: { x: 110, y: 547, maxWidth: 450, fontSize: 9 },

  // Block 2 - Operational Period
  opPeriodFrom: { x: 110, y: 527, fontSize: 8 },
  opPeriodTo: { x: 400, y: 527, fontSize: 8 },

  // Block 3 - Organization Chart (visual positions)
  orgChart: {
    incidentCommander: { x: 370, y: 480, maxWidth: 120, fontSize: 8 },
    safetyOfficer: { x: 150, y: 430, maxWidth: 100, fontSize: 7 },
    publicInfoOfficer: { x: 280, y: 430, maxWidth: 100, fontSize: 7 },
    liaisonOfficer: { x: 410, y: 430, maxWidth: 100, fontSize: 7 },
    operationsChief: { x: 150, y: 350, maxWidth: 110, fontSize: 7 },
    planningChief: { x: 280, y: 350, maxWidth: 110, fontSize: 7 },
    logisticsChief: { x: 410, y: 350, maxWidth: 110, fontSize: 7 },
    financeChief: { x: 540, y: 350, maxWidth: 110, fontSize: 7 },
  },

  // Block 4 - Prepared by
  preparedByName: { x: 200, y: 65, maxWidth: 250, fontSize: 9 },
  preparedByDateTime: { x: 600, y: 65, fontSize: 9 },
};

// ICS 208 - Safety Message/Plan
export const ICS_208_BLOCKS = {
  // Block 1 - Incident Name
  incidentName: { x: 110, y: 717, maxWidth: 280, fontSize: 10 },

  // Block 2 - Operational Period
  opPeriodFrom: { x: 110, y: 692, fontSize: 9 },
  opPeriodTo: { x: 310, y: 692, fontSize: 9 },

  // Block 3 - Safety Message/Expanded Safety Message
  safetyMessageStart: { x: 50, y: 660, maxWidth: 520, fontSize: 9 },
  safetyLineHeight: 18,

  // Block 4 - Site Safety Plan Required
  siteSafetyPlanRequired: { x: 285, y: 250, fontSize: 10 },
  siteSafetyPlanLocation: { x: 110, y: 230, maxWidth: 450, fontSize: 9 },

  // Block 5 - Prepared by
  preparedByName: { x: 110, y: 95, maxWidth: 200, fontSize: 9 },
  preparedByPosition: { x: 320, y: 95, maxWidth: 150, fontSize: 9 },
  preparedByDateTime: { x: 480, y: 95, fontSize: 9 },

  // Block 6 - Approved by
  approvedByName: { x: 110, y: 65, maxWidth: 200, fontSize: 9 },
  approvedByDateTime: { x: 480, y: 65, fontSize: 9 },
};

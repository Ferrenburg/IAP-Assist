/**
 * ICS Organization Positions
 */

export const COMMAND_STAFF_POSITIONS = [
  'Incident Commander',
  'Deputy Incident Commander',
  'Safety Officer',
  'Assistant Safety Officer',
  'Public Information Officer',
  'Assistant Public Information Officer',
  'Liaison Officer',
  'Assistant Liaison Officer',
  'Agency Representative',
] as const;

export const OPERATIONS_POSITIONS = [
  'Operations Section Chief',
  'Deputy Operations Section Chief',
  'Staging Area Manager',
  'Air Operations Branch Director',
  'Air Tactical Group Supervisor',
  'Air Support Group Supervisor',
] as const;

export const PLANNING_POSITIONS = [
  'Planning Section Chief',
  'Deputy Planning Section Chief',
  'Resources Unit Leader',
  'Situation Unit Leader',
  'Documentation Unit Leader',
  'Demobilization Unit Leader',
  'Technical Specialist',
] as const;

export const LOGISTICS_POSITIONS = [
  'Logistics Section Chief',
  'Deputy Logistics Section Chief',
  // Support Branch
  'Support Branch Director',
  'Supply Unit Leader',
  'Facilities Unit Leader',
  'Ground Support Unit Leader',
  // Service Branch
  'Service Branch Director',
  'Communications Unit Leader',
  'Medical Unit Leader',
  'Food Unit Leader',
] as const;

export const FINANCE_POSITIONS = [
  'Finance/Administration Section Chief',
  'Deputy Finance/Administration Section Chief',
  'Time Unit Leader',
  'Procurement Unit Leader',
  'Compensation/Claims Unit Leader',
  'Cost Unit Leader',
] as const;

export const DIVISION_GROUP_TYPES = [
  // Branches
  'Air Operations Branch',
  'Ground Support Branch',
  'Law Enforcement Branch',
  // Divisions
  'Division A',
  'Division B',
  'Division C',
  'Division D',
  'Division E',
  'Division F',
  'Division G',
  'Division H',
  'Division I',
  'Division J',
  'Division K',
  'Division L',
  'Division M',
  'Division N',
  'Division O',
  'Division P',
  'Division Q',
  'Division R',
  'Division S',
  'Division T',
  'Division U',
  'Division V',
  'Division W',
  'Division X',
  'Division Y',
  'Division Z',
  // Groups
  'Medical Group',
  'Search Group',
  'Rescue Group',
  'Evacuation Group',
] as const;

export const ALL_POSITIONS = [
  ...COMMAND_STAFF_POSITIONS,
  ...OPERATIONS_POSITIONS,
  ...PLANNING_POSITIONS,
  ...LOGISTICS_POSITIONS,
  ...FINANCE_POSITIONS,
] as const;

export type ICSPosition = typeof ALL_POSITIONS[number];
export type DivisionGroupType = typeof DIVISION_GROUP_TYPES[number];

/**
 * Field Validation for ICS Form PDF Export
 *
 * Validates that all fields have proper anchors before rendering.
 * Prevents text from drifting into wrong blocks.
 */

import { FieldPosition } from './field-mappings';

export interface ValidationError {
  formNumber: string;
  blockNumber: string;
  fieldLabel: string;
  issue: string;
}

export interface FieldValidation {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate a single field position
 */
export function validateFieldPosition(
  formNumber: string,
  blockNumber: string,
  fieldLabel: string,
  position: FieldPosition | undefined
): ValidationError | null {
  if (!position) {
    return {
      formNumber,
      blockNumber,
      fieldLabel,
      issue: 'Field position is undefined - no anchor coordinates',
    };
  }

  if (position.x === undefined || position.y === undefined) {
    return {
      formNumber,
      blockNumber,
      fieldLabel,
      issue: 'Missing x or y coordinate',
    };
  }

  if (position.x < 0 || position.y < 0) {
    return {
      formNumber,
      blockNumber,
      fieldLabel,
      issue: `Invalid coordinates: x=${position.x}, y=${position.y}`,
    };
  }

  if (position.x > 792 || position.y > 792) {
    return {
      formNumber,
      blockNumber,
      fieldLabel,
      issue: `Coordinates exceed max page size: x=${position.x}, y=${position.y}`,
    };
  }

  if (!position.maxWidth) {
    return {
      formNumber,
      blockNumber,
      fieldLabel,
      issue: 'Missing maxWidth - field has no overflow boundary',
    };
  }

  if (!position.fontSize) {
    return {
      formNumber,
      blockNumber,
      fieldLabel,
      issue: 'Missing fontSize - cannot render text',
    };
  }

  return null;
}

/**
 * Validate all required fields for a form
 */
export function validateFormFields(
  formNumber: string,
  requiredFields: Array<{
    blockNumber: string;
    fieldLabel: string;
    position: FieldPosition | undefined;
  }>
): FieldValidation {
  const errors: ValidationError[] = [];

  requiredFields.forEach(({ blockNumber, fieldLabel, position }) => {
    const error = validateFieldPosition(formNumber, blockNumber, fieldLabel, position);
    if (error) {
      errors.push(error);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if text will overflow field boundaries
 */
export function willTextOverflow(
  text: string,
  fontWidthPerChar: number,
  maxWidth: number
): boolean {
  const estimatedWidth = text.length * fontWidthPerChar;
  return estimatedWidth > maxWidth;
}

/**
 * Validate table row positions don't overlap header
 */
export function validateTableRowPosition(
  formNumber: string,
  tableStartY: number,
  rowHeight: number,
  rowIndex: number,
  headerMaxY: number
): ValidationError | null {
  const rowY = tableStartY - (rowHeight * rowIndex);

  if (rowY >= headerMaxY) {
    return {
      formNumber,
      blockNumber: 'table',
      fieldLabel: `row ${rowIndex}`,
      issue: `Row position ${rowY} overlaps header boundary at ${headerMaxY}`,
    };
  }

  return null;
}

/**
 * Validate footer positions don't overlap content
 */
export function validateFooterPosition(
  formNumber: string,
  footerY: number,
  contentMinY: number
): ValidationError | null {
  if (footerY >= contentMinY) {
    return {
      formNumber,
      blockNumber: 'footer',
      fieldLabel: 'prepared-by',
      issue: `Footer position ${footerY} overlaps content boundary at ${contentMinY}`,
    };
  }

  return null;
}

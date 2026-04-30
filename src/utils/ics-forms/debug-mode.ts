/**
 * Debug Mode for ICS Form PDF Export
 *
 * Draws field anchor boxes and block boundaries on the PDF template
 * to visually verify field placement.
 */

import { PDFPage, rgb } from 'pdf-lib';
import { FieldPosition, BlockMapping } from './field-mappings';

/**
 * Draw a field boundary box on the PDF
 */
export function drawFieldBoundary(
  page: PDFPage,
  position: FieldPosition,
  label: string,
  color: { r: number; g: number; b: number } = { r: 1, g: 0, b: 0 }
): void {
  const width = position.maxWidth || 100;
  const height = position.maxHeight || (position.fontSize || 10) + 4;

  // Draw rectangle border
  page.drawRectangle({
    x: position.x,
    y: position.y,
    width,
    height,
    borderColor: rgb(color.r, color.g, color.b),
    borderWidth: 0.5,
    opacity: 0.3,
  });

  // Draw field label above the box
  if (label) {
    page.drawText(label, {
      x: position.x,
      y: position.y + height + 2,
      size: 6,
      color: rgb(color.r, color.g, color.b),
    });
  }

  // Draw crosshair at anchor point
  const crosshairSize = 3;
  page.drawLine({
    start: { x: position.x - crosshairSize, y: position.y },
    end: { x: position.x + crosshairSize, y: position.y },
    thickness: 1,
    color: rgb(color.r, color.g, color.b),
  });
  page.drawLine({
    start: { x: position.x, y: position.y - crosshairSize },
    end: { x: position.x, y: position.y + crosshairSize },
    thickness: 1,
    color: rgb(color.r, color.g, color.b),
  });
}

/**
 * Draw all field boundaries for a block mapping
 */
export function drawBlockBoundaries(
  page: PDFPage,
  blockMapping: BlockMapping,
  blockColor: { r: number; g: number; b: number } = { r: 0, g: 0, b: 1 }
): void {
  Object.entries(blockMapping).forEach(([fieldName, position]) => {
    if (position && typeof position === 'object' && 'x' in position && 'y' in position) {
      drawFieldBoundary(page, position, fieldName, blockColor);
    }
  });
}

/**
 * Draw section separator lines
 */
export function drawSectionSeparators(
  page: PDFPage,
  sections: Array<{ label: string; yPosition: number }>
): void {
  const { width } = page.getSize();

  sections.forEach((section) => {
    // Draw horizontal line
    page.drawLine({
      start: { x: 30, y: section.yPosition },
      end: { x: width - 30, y: section.yPosition },
      thickness: 0.5,
      color: rgb(0.8, 0, 0.8),
      opacity: 0.4,
      dashArray: [3, 3],
    });

    // Draw section label
    page.drawText(section.label, {
      x: 10,
      y: section.yPosition + 2,
      size: 7,
      color: rgb(0.8, 0, 0.8),
    });
  });
}

/**
 * Draw table row guidelines
 */
export function drawTableRowGuidelines(
  page: PDFPage,
  tableStartY: number,
  rowHeight: number,
  numRows: number,
  tableWidth: number,
  startX: number = 30
): void {
  for (let i = 0; i <= numRows; i++) {
    const y = tableStartY - (rowHeight * i);

    page.drawLine({
      start: { x: startX, y },
      end: { x: startX + tableWidth, y },
      thickness: 0.3,
      color: rgb(0, 0.7, 0),
      opacity: 0.3,
      dashArray: [2, 2],
    });

    // Row number
    page.drawText(`R${i}`, {
      x: startX - 15,
      y: y - rowHeight / 2,
      size: 6,
      color: rgb(0, 0.7, 0),
    });
  }
}

/**
 * Draw column guidelines
 */
export function drawColumnGuidelines(
  page: PDFPage,
  columns: Array<{ x: number; label: string }>,
  tableStartY: number,
  tableHeight: number
): void {
  columns.forEach((col) => {
    page.drawLine({
      start: { x: col.x, y: tableStartY },
      end: { x: col.x, y: tableStartY - tableHeight },
      thickness: 0.3,
      color: rgb(0, 0.7, 0),
      opacity: 0.3,
      dashArray: [2, 2],
    });

    // Column label
    page.drawText(col.label, {
      x: col.x + 2,
      y: tableStartY + 5,
      size: 6,
      color: rgb(0, 0.7, 0),
    });
  });
}

/**
 * Draw page coordinate grid
 */
export function drawCoordinateGrid(
  page: PDFPage,
  gridSpacing: number = 50
): void {
  const { width, height } = page.getSize();

  // Vertical grid lines
  for (let x = 0; x <= width; x += gridSpacing) {
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: height },
      thickness: 0.2,
      color: rgb(0.9, 0.9, 0.9),
      opacity: 0.5,
    });

    if (x % 100 === 0) {
      page.drawText(String(x), {
        x: x + 2,
        y: height - 12,
        size: 7,
        color: rgb(0.7, 0.7, 0.7),
      });
    }
  }

  // Horizontal grid lines
  for (let y = 0; y <= height; y += gridSpacing) {
    page.drawLine({
      start: { x: 0, y },
      end: { x: width, y },
      thickness: 0.2,
      color: rgb(0.9, 0.9, 0.9),
      opacity: 0.5,
    });

    if (y % 100 === 0) {
      page.drawText(String(y), {
        x: 5,
        y: y + 2,
        size: 7,
        color: rgb(0.7, 0.7, 0.7),
      });
    }
  }
}

/**
 * Enable debug mode for a form
 */
export interface DebugOptions {
  showFieldBoundaries?: boolean;
  showCoordinateGrid?: boolean;
  showSectionSeparators?: boolean;
  showTableGuidelines?: boolean;
}

export const DEBUG_MODE = {
  enabled: false,
  options: {
    showFieldBoundaries: true,
    showCoordinateGrid: true,
    showSectionSeparators: true,
    showTableGuidelines: true,
  } as DebugOptions,
};

/**
 * Enable debug mode
 */
export function enableDebugMode(options?: DebugOptions): void {
  DEBUG_MODE.enabled = true;
  if (options) {
    DEBUG_MODE.options = { ...DEBUG_MODE.options, ...options };
  }
}

/**
 * Disable debug mode
 */
export function disableDebugMode(): void {
  DEBUG_MODE.enabled = false;
}

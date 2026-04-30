/**
 * Coordinate Testing Utility
 *
 * Use this to test where text will appear on the PDF.
 * Uncomment the sections you want to test.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { TEMPLATE_URLS } from './templates';

/**
 * Draw a crosshair and label at specific coordinates
 * This helps you visualize where a field position is on the PDF
 */
export async function testCoordinate(
  templateUrl: string,
  testX: number,
  testY: number,
  label: string = 'TEST'
): Promise<Uint8Array> {
  const response = await fetch(templateUrl);
  const arrayBuffer = await response.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.getPages()[0];

  // Draw crosshair
  const crosshairSize = 10;

  // Horizontal line
  page.drawLine({
    start: { x: testX - crosshairSize, y: testY },
    end: { x: testX + crosshairSize, y: testY },
    thickness: 2,
    color: rgb(1, 0, 0),
  });

  // Vertical line
  page.drawLine({
    start: { x: testX, y: testY - crosshairSize },
    end: { x: testX, y: testY + crosshairSize },
    thickness: 2,
    color: rgb(1, 0, 0),
  });

  // Draw label
  page.drawText(label, {
    x: testX + 15,
    y: testY,
    size: 10,
    font,
    color: rgb(0, 0, 1),
  });

  // Draw coordinates
  page.drawText(`(${testX}, ${testY})`, {
    x: testX + 15,
    y: testY - 12,
    size: 8,
    font,
    color: rgb(1, 0, 0),
  });

  return await pdfDoc.save();
}

/**
 * Example: Test where the incident name should appear on ICS 202
 *
 * Usage:
 * 1. Uncomment the code below
 * 2. Call this from the export page
 * 3. It will generate a PDF with a red crosshair showing where text will appear
 */

/*
export async function testICS202IncidentName(): Promise<Uint8Array> {
  return await testCoordinate(
    TEMPLATE_URLS.ICS_202,
    100,  // x coordinate - try different values
    740,  // y coordinate - try different values
    'Incident Name Position'
  );
}
*/

/**
 * Draw a grid on the PDF to help measure coordinates
 */
export async function drawMeasurementGrid(
  templateUrl: string,
  gridSpacing: number = 50
): Promise<Uint8Array> {
  const response = await fetch(templateUrl);
  const arrayBuffer = await response.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();

  console.log(`PDF Dimensions: ${width} x ${height}`);

  // Draw vertical grid lines
  for (let x = 0; x <= width; x += gridSpacing) {
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: height },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
      opacity: 0.5,
    });

    // Label every 100 points
    if (x % 100 === 0) {
      page.drawText(String(x), {
        x: x + 2,
        y: height - 15,
        size: 8,
        font,
        color: rgb(1, 0, 0),
      });
    }
  }

  // Draw horizontal grid lines
  for (let y = 0; y <= height; y += gridSpacing) {
    page.drawLine({
      start: { x: 0, y },
      end: { x: width, y },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
      opacity: 0.5,
    });

    // Label every 100 points
    if (y % 100 === 0) {
      page.drawText(String(y), {
        x: 5,
        y: y + 2,
        size: 8,
        font,
        color: rgb(1, 0, 0),
      });
    }
  }

  return await pdfDoc.save();
}

/**
 * UNCOMMENT THIS TO TEST:
 *
 * Then add a button in export.tsx like:
 *
 * <button onClick={async () => {
 *   const pdf = await drawMeasurementGrid(TEMPLATE_URLS.ICS_202, 50);
 *   await pdfCombiner.downloadPDF(pdf, 'ICS202_Grid.pdf');
 * }}>
 *   Download ICS 202 with Grid
 * </button>
 */

/**
 * Coordinate Recalibration Utility
 *
 * This utility helps recalibrate coordinates for PDF form fields.
 * PDF coordinate system uses bottom-left as origin (0,0).
 *
 * For standard Letter size PDFs:
 * - Portrait: 612pt width x 792pt height
 * - Landscape: 792pt width x 612pt height
 *
 * To recalibrate coordinates:
 * 1. Open the PDF template in a PDF viewer that shows coordinates
 * 2. Measure the x,y position of each field (bottom-left corner of text)
 * 3. Update the values in field-mappings.ts
 *
 * Common measurement tools:
 * - Adobe Acrobat (shows coordinates in status bar)
 * - PDF.js (can add coordinate overlay)
 * - Online PDF coordinate tools
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Add a coordinate grid overlay to a PDF for calibration
 */
export async function addCoordinateGrid(
  templatePath: string,
  gridSpacing: number = 50
): Promise<Uint8Array> {
  const response = await fetch(templatePath);
  const arrayBuffer = await response.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();

  // Draw vertical grid lines
  for (let x = 0; x <= width; x += gridSpacing) {
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: height },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
      opacity: 0.5,
    });

    // Label every 100pts
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

    // Label every 100pts
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

  // Add page dimensions at corners
  page.drawText(`(0, 0)`, {
    x: 10,
    y: 10,
    size: 10,
    font,
    color: rgb(1, 0, 0),
  });

  page.drawText(`(${width}, ${height})`, {
    x: width - 80,
    y: height - 20,
    size: 10,
    font,
    color: rgb(1, 0, 0),
  });

  return await pdfDoc.save();
}

/**
 * Test coordinates by placing text at specific positions
 */
export async function testCoordinates(
  templatePath: string,
  testPoints: Array<{ x: number; y: number; label: string }>
): Promise<Uint8Array> {
  const response = await fetch(templatePath);
  const arrayBuffer = await response.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.getPages()[0];

  testPoints.forEach((point) => {
    // Draw a crosshair at the point
    page.drawLine({
      start: { x: point.x - 10, y: point.y },
      end: { x: point.x + 10, y: point.y },
      thickness: 1,
      color: rgb(1, 0, 0),
    });
    page.drawLine({
      start: { x: point.x, y: point.y - 10 },
      end: { x: point.x, y: point.y + 10 },
      thickness: 1,
      color: rgb(1, 0, 0),
    });

    // Draw the label
    page.drawText(point.label, {
      x: point.x,
      y: point.y,
      size: 10,
      font,
      color: rgb(0, 0, 1),
    });

    // Draw coordinates
    page.drawText(`(${point.x}, ${point.y})`, {
      x: point.x,
      y: point.y - 12,
      size: 7,
      font,
      color: rgb(1, 0, 0),
    });
  });

  return await pdfDoc.save();
}

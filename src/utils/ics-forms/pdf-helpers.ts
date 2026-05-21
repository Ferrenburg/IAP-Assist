import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';

export interface TextLine {
  text: string;
  y: number;
}

/**
 * Sanitize text for PDF rendering by removing/replacing characters that WinAnsi encoding can't handle
 */
export function sanitizeText(text: string): string {
  if (!text) return '';

  // Replace newlines and other control characters with spaces
  return text
    .replace(/\r\n/g, ' ')  // Windows line endings
    .replace(/\n/g, ' ')     // Unix line endings
    .replace(/\r/g, ' ')     // Mac line endings
    .replace(/\t/g, ' ')     // Tabs
    .replace(/\s+/g, ' ')    // Multiple spaces to single space
    .trim();
}

/**
 * Wrap text to fit within a maximum width
 */
export function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  // Sanitize text first to remove newlines
  const sanitized = sanitizeText(text);
  const words = sanitized.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Draw text with automatic wrapping
 */
export function drawWrappedText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
  lineHeight: number
): number {
  const lines = wrapText(text, font, fontSize, maxWidth);
  let currentY = y;

  for (const line of lines) {
    page.drawText(line, {
      x,
      y: currentY,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
    currentY -= lineHeight;
  }

  return currentY; // Return the final Y position
}

/**
 * Draw a checkbox (checked or unchecked)
 */
export function drawCheckbox(
  page: PDFPage,
  x: number,
  y: number,
  size: number,
  checked: boolean
): void {
  // Draw checkbox outline
  page.drawRectangle({
    x,
    y,
    width: size,
    height: size,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  // Draw X if checked
  if (checked) {
    const margin = size * 0.2;
    page.drawLine({
      start: { x: x + margin, y: y + margin },
      end: { x: x + size - margin, y: y + size - margin },
      thickness: 2,
      color: rgb(0, 0, 0),
    });
    page.drawLine({
      start: { x: x + size - margin, y: y + margin },
      end: { x: x + margin, y: y + size - margin },
      thickness: 2,
      color: rgb(0, 0, 0),
    });
  }
}

/**
 * Format date as MM/DD/YYYY
 */
export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  // Parse the date portion directly to avoid UTC-midnight → previous-day shift.
  // isoDate() always hands us a YYYY-MM-DD string; split it instead of using
  // new Date() which treats bare date strings as UTC and can roll back a day
  // for users in negative-UTC-offset timezones.
  const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = datePart.split('-');
  if (parts.length !== 3) return '';
  const [year, month, day] = parts;
  if (!year || !month || !day) return '';
  return `${month}/${day}/${year}`;
}

/**
 * Format time as 24-hour HH:MM
 */
export function formatTime(timeStr: string | undefined): string {
  if (!timeStr) return '';

  // If already in 24-hour format, return as-is
  if (timeStr.match(/^\d{2}:\d{2}$/)) {
    return timeStr;
  }

  // Try to parse and convert to 24-hour
  const timeParts = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!timeParts) return timeStr;

  let hours = parseInt(timeParts[1]);
  const minutes = timeParts[2];
  const period = timeParts[3]?.toUpperCase();

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

/**
 * Format date and time combined
 */
export function formatDateTime(dateStr: string | undefined, timeStr: string | undefined): string {
  const date = formatDate(dateStr);
  const time = formatTime(timeStr);
  if (!date && !time) return '';
  if (!date) return time;
  if (!time) return date;
  return `${date} ${time}`;
}

/**
 * Load template PDF and extract first page only
 * Includes retry logic for errors
 */
export async function loadTemplateFirstPage(templateKey: string): Promise<PDFDocument> {
  // Import the loader dynamically to avoid circular dependencies
  const { loadPdfTemplateFirstPage } = await import('./load-pdf-template');
  return await loadPdfTemplateFirstPage(templateKey);
}

/**
 * Create a continuation page by copying the template's first page
 */
export async function createContinuationPage(
  pdfDoc: PDFDocument,
  templateKey: string
): Promise<PDFPage> {
  const { loadPdfTemplateFull } = await import('./load-pdf-template');
  const templateDoc = await loadPdfTemplateFull(templateKey);

  const [templatePage] = await pdfDoc.copyPages(templateDoc, [0]);
  pdfDoc.addPage(templatePage);

  return templatePage;
}

/**
 * Draw page number footer
 */
export function drawPageNumber(
  page: PDFPage,
  pageNum: number,
  totalPages: number,
  formNumber: string
): void {
  const { height } = page.getSize();

  // Page numbering typically goes in bottom right
  // Format: "ICS 202 IAP Page ___"
  const text = `${formNumber} IAP Page ${pageNum}`;

  // Position at bottom (around y: 30-40)
  page.drawText(text, {
    x: 450,
    y: 30,
    size: 8,
    color: rgb(0, 0, 0),
  });
}

/**
 * Truncate text to fit width with ellipsis
 */
export function truncateText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string {
  const fullWidth = font.widthOfTextAtSize(text, fontSize);

  if (fullWidth <= maxWidth) {
    return text;
  }

  const ellipsis = '...';
  const ellipsisWidth = font.widthOfTextAtSize(ellipsis, fontSize);

  let truncated = text;
  while (font.widthOfTextAtSize(truncated + ellipsis, fontSize) > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }

  return truncated + ellipsis;
}

/**
 * Draw text in a table cell with proper clipping
 */
export function drawTableCell(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
  rotation?: number
): void {
  if (!text) return; // Don't render empty/null values

  const sanitized = sanitizeText(text);
  const displayText = truncateText(sanitized, font, fontSize, maxWidth);

  const textOptions: any = {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  };

  if (rotation !== undefined) {
    textOptions.rotate = { type: 'degrees', angle: rotation };
  }

  page.drawText(displayText, textOptions);
}

/**
 * Draw text with strict field boundaries (no overflow)
 */
export function drawBoundedText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
  maxHeight?: number
): void {
  if (!text) return;

  // Sanitize and truncate to fit width
  const sanitized = sanitizeText(text);
  const displayText = truncateText(sanitized, font, fontSize, maxWidth);

  // Check if it fits height (if specified)
  if (maxHeight !== undefined) {
    const textHeight = fontSize * 1.2; // approximate line height
    if (textHeight > maxHeight) {
      return; // Skip rendering if doesn't fit
    }
  }

  page.drawText(displayText, {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });
}

/**
 * Draw text with word wrapping that respects max height
 */
export function drawWrappedTextBounded(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
  lineHeight: number,
  maxHeight?: number
): number {
  if (!text) return y;

  const lines = wrapText(text, font, fontSize, maxWidth);
  let currentY = y;
  let lineCount = 0;

  const maxLines = maxHeight ? Math.floor(maxHeight / lineHeight) : lines.length;

  for (const line of lines) {
    if (maxHeight && lineCount >= maxLines) {
      // Truncate with ellipsis if we run out of space
      const lastLineY = y - (lineHeight * (maxLines - 1));
      page.drawText('...', {
        x: x + maxWidth - 20,
        y: lastLineY,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
      break;
    }

    page.drawText(line, {
      x,
      y: currentY,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    currentY -= lineHeight;
    lineCount++;
  }

  return currentY;
}

/**
 * Add OpPeriod footer to the bottom of a page
 */
export function addOpPeriodFooter(page: any, font: any) {
  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const footerText = `Generated by OpPeriod IAP Assist - ${dateStr} ${timeStr} ${timezone}`;

  page.drawText(footerText, {
    x: 50,
    y: 15,
    size: 6,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
}

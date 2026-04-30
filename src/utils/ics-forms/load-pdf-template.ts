import { PDFDocument } from 'pdf-lib';
import { getPdfTemplateUrl } from './pdf-asset-urls';

/**
 * Fetch PDF data with comprehensive validation
 */
async function fetchPdfData(url: string, retries = 3): Promise<ArrayBuffer> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[PDF Fetch] Attempt ${attempt}/${retries}: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Log response details
      console.log(`[PDF Fetch] Response status: ${response.status} ${response.statusText}`);
      console.log(`[PDF Fetch] Response URL: ${response.url}`);

      const contentType = response.headers.get('content-type') || '';
      console.log(`[PDF Fetch] Content-Type: ${contentType}`);

      // Validate response status
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText} at ${response.url}`);
      }

      // Check if we got HTML instead of PDF (SPA fallback or wrong path)
      if (contentType.includes('text/html')) {
        throw new Error(
          `PDF URL resolved to HTML instead of PDF: ${response.url}\n` +
          `Content-Type: ${contentType}\n` +
          `This likely means:\n` +
          `  1. The PDF file doesn't exist at the expected path\n` +
          `  2. SPA fallback is catching the request\n` +
          `  3. The deployment base path is incorrect`
        );
      }

      // Fetch the actual data
      const arrayBuffer = await response.arrayBuffer();
      console.log(`[PDF Fetch] Received ${arrayBuffer.byteLength} bytes`);

      // Validate PDF header
      const headerBytes = new Uint8Array(arrayBuffer.slice(0, 8));
      const header = new TextDecoder().decode(headerBytes);

      console.log(`[PDF Fetch] File header: ${header}`);

      if (!header.startsWith('%PDF-')) {
        // Log more context for debugging
        const firstBytes = new TextDecoder().decode(arrayBuffer.slice(0, 200));
        throw new Error(
          `File is not a valid PDF. Got header: "${header}"\n` +
          `First 200 bytes: ${firstBytes}\n` +
          `URL: ${response.url}\n` +
          `Content-Type: ${contentType}`
        );
      }

      console.log(`[PDF Fetch] ✅ Successfully fetched valid PDF (${arrayBuffer.byteLength} bytes)`);
      return arrayBuffer;

    } catch (error) {
      lastError = error as Error;
      console.error(`[PDF Fetch] ❌ Error on attempt ${attempt}/${retries}:`, error);

      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const delay = error instanceof Error && error.name === 'AbortError' ? 1000 : 500;
        const waitTime = delay * attempt;
        console.log(`[PDF Fetch] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('Failed to fetch PDF after multiple attempts');
}

/**
 * Load a PDF template and return only the first page
 */
export async function loadPdfTemplateFirstPage(templateKey: string): Promise<PDFDocument> {
  console.log(`[PDF Template] Loading template: ${templateKey}`);

  const pdfUrl = getPdfTemplateUrl(templateKey);
  console.log(`[PDF Template] Resolved URL: ${pdfUrl}`);

  try {
    const arrayBuffer = await fetchPdfData(pdfUrl);
    const templateDoc = await PDFDocument.load(arrayBuffer);

    // Create new document with only first page
    const newDoc = await PDFDocument.create();
    const [firstPage] = await newDoc.copyPages(templateDoc, [0]);
    newDoc.addPage(firstPage);

    console.log(`[PDF Template] ✅ Successfully loaded ${templateKey}`);
    return newDoc;
  } catch (error) {
    console.error(`[PDF Template] ❌ Failed to load ${templateKey}:`, error);
    throw error;
  }
}

/**
 * Load a full PDF template (all pages)
 */
export async function loadPdfTemplateFull(templateKey: string): Promise<PDFDocument> {
  console.log(`[PDF Template Full] Loading template: ${templateKey}`);

  const pdfUrl = getPdfTemplateUrl(templateKey);
  console.log(`[PDF Template Full] Resolved URL: ${pdfUrl}`);

  try {
    const arrayBuffer = await fetchPdfData(pdfUrl);
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    console.log(`[PDF Template Full] ✅ Successfully loaded ${templateKey}`);
    return pdfDoc;
  } catch (error) {
    console.error(`[PDF Template Full] ❌ Failed to load ${templateKey}:`, error);
    throw error;
  }
}

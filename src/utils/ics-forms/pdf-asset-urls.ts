/**
 * PDF Asset URL Resolution - Vite Asset Imports
 *
 * PDFs are imported from src/assets/pdfs/ as Vite assets.
 * Vite bundles them into the component output and resolves URLs at build time.
 *
 * IMPORTANT: Do NOT import from /public - Vite forbids importing from public directory.
 * Assets must live under src/ to be included in the build graph.
 */

// Import PDFs as Vite assets - they'll be bundled into the component output
import ics202Pdf from '../../assets/pdfs/ICS202.pdf';
import ics203Pdf from '../../assets/pdfs/ICS203.pdf';
import ics204Pdf from '../../assets/pdfs/ICS204.pdf';
import ics205Pdf from '../../assets/pdfs/ICS205.pdf';
import ics205aPdf from '../../assets/pdfs/ICS205A.pdf';
import ics206Pdf from '../../assets/pdfs/ICS206.pdf';
import ics207Pdf from '../../assets/pdfs/ICS207.pdf';
import ics208Pdf from '../../assets/pdfs/ICS208.pdf';
import ics233Pdf from '../../assets/pdfs/ICS233.pdf';

/**
 * PDF template URL mapping
 * These URLs are resolved by Vite at build time to bundled asset paths
 */
const PDF_URLS: Record<string, string> = {
  'ICS_202': ics202Pdf,
  'ICS_203': ics203Pdf,
  'ICS_204': ics204Pdf,
  'ICS_205': ics205Pdf,
  'ICS_205A': ics205aPdf,
  'ICS_206': ics206Pdf,
  'ICS_207': ics207Pdf,
  'ICS_208': ics208Pdf,
  'ICS_233': ics233Pdf,
};

console.log('[PDF Assets] Loaded template URLs:', PDF_URLS);

/**
 * Get the URL for a PDF template by key
 * @param templateKey - The template key (e.g., 'ICS_202')
 * @returns The bundled asset URL (resolved by Vite)
 */
export function getPdfTemplateUrl(templateKey: string): string {
  const url = PDF_URLS[templateKey];

  if (!url) {
    throw new Error(`Unknown PDF template key: ${templateKey}. Available keys: ${Object.keys(PDF_URLS).join(', ')}`);
  }

  console.log(`[PDF Asset URL] Resolved ${templateKey} -> ${url}`);
  return url;
}

/**
 * Get all available template keys
 */
export function getAvailableTemplateKeys(): string[] {
  return Object.keys(PDF_URLS);
}

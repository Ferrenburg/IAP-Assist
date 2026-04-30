/**
 * Template Verification Utility
 *
 * Use this to verify that PDF templates are loading correctly
 */

import { TEMPLATE_URLS } from './templates';

export function verifyTemplates(): void {
  console.log('=== PDF Template Verification ===');

  Object.entries(TEMPLATE_URLS).forEach(([key, url]) => {
    console.log(`${key}:`);
    console.log(`  URL: ${url}`);
    console.log(`  Type: ${typeof url}`);
    console.log(`  Starts with http: ${url.startsWith('http')}`);
    console.log(`  Starts with /: ${url.startsWith('/')}`);
    console.log(`  Contains .pdf: ${url.includes('.pdf')}`);
    console.log('');
  });
}

export async function testFetchTemplate(templateUrl: string): Promise<void> {
  console.log(`Testing fetch for: ${templateUrl}`);

  try {
    const response = await fetch(templateUrl);
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Content-Type: ${response.headers.get('content-type')}`);
    console.log(`  Content-Length: ${response.headers.get('content-length')}`);

    const arrayBuffer = await response.arrayBuffer();
    console.log(`  Bytes loaded: ${arrayBuffer.byteLength}`);

    // Check PDF header
    const header = new Uint8Array(arrayBuffer.slice(0, 5));
    const headerStr = String.fromCharCode(...header);
    console.log(`  Header: ${headerStr}`);
    console.log(`  Valid PDF: ${headerStr.startsWith('%PDF')}`);
  } catch (error) {
    console.error(`  ERROR: ${error}`);
  }
}

import { PDFDocument } from 'pdf-lib';

export class PDFCombiner {
  async combinePDFs(pdfBuffers: Uint8Array[]): Promise<Uint8Array> {
    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    // Iterate through each PDF buffer
    for (const pdfBuffer of pdfBuffers) {
      try {
        // Load the PDF
        const pdf = await PDFDocument.load(pdfBuffer);

        // Copy all pages from this PDF
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

        // Add each page to the merged document
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      } catch (error) {
        console.error('Error loading PDF:', error);
        throw new Error(`Failed to load PDF: ${error}`);
      }
    }

    // Save the merged PDF
    const mergedPdfBytes = await mergedPdf.save();
    return mergedPdfBytes;
  }

  async downloadPDF(pdfBytes: Uint8Array, filename: string): Promise<void> {
    return new Promise((resolve) => {
      // Create a blob from the PDF bytes
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup after a short delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        resolve();
      }, 100);
    });
  }
}

export const pdfCombiner = new PDFCombiner();

import { PDFDocument } from 'pdf-lib';

export async function debugPDFDimensions(templatePath: string): Promise<void> {
  const response = await fetch(templatePath);
  const arrayBuffer = await response.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();

  console.log(`PDF: ${templatePath}`);
  console.log(`  Width: ${width}pt, Height: ${height}pt`);
  console.log(`  Coordinate system: bottom-left origin`);
  console.log(`  Top of page: y=${height}`);
  console.log(`  Bottom of page: y=0`);
}

export async function debugAllTemplates(): Promise<void> {
  const templates = [
    '/ics-templates/ics_form_202,_incident_objectives_(v3.1).pdf',
    '/ics-templates/ics_form_203,_organization_assignment_list_(v3).pdf',
    '/ics-templates/ics_form_204,_assignment_list_(v3.1).pdf',
    '/ics-templates/ics_form_205,_incident_radio_communications_plan_(v3.1).pdf',
    '/ics-templates/ics_form_205a,_communications_list_(v3).pdf',
    '/ics-templates/ics_form_206,_medical_plan_(v3).pdf',
    '/ics-templates/ics_form_207,_incident_organization_chart_(v3).pdf',
    '/ics-templates/ics_form_208,_safety_message-plan_(v3.1).pdf',
  ];

  for (const template of templates) {
    await debugPDFDimensions(template);
    console.log('');
  }
}

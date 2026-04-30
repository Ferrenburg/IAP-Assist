import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

import ics202TemplateUrl from '../imports/ics_form_202,_incident_objectives_(v3.1).pdf';
import ics203TemplateUrl from '../imports/ics_form_203,_organization_assignment_list_(v3).pdf';
import ics204TemplateUrl from '../imports/ics_form_204,_assignment_list_(v3.1).pdf';
import ics205TemplateUrl from '../imports/ics_form_205,_incident_radio_communications_plan_(v3.1).pdf';
import ics205aTemplateUrl from '../imports/ics_form_205a,_communications_list_(v3).pdf';
import ics206TemplateUrl from '../imports/ics_form_206,_medical_plan_(v3).pdf';
import ics207TemplateUrl from '../imports/ics_form_207,_incident_organization_chart_(v3).pdf';
import ics208TemplateUrl from '../imports/ics_form_208,_safety_message-plan_(v3.1).pdf';

export interface ICSFormData {
  iapData: any;
  periodData: any;
  formData?: any;
}

export class PDFGeneratorV2 {
  private async loadTemplate(templatePath: string): Promise<PDFDocument> {
    // Fetch the template PDF
    const response = await fetch(templatePath);
    const arrayBuffer = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // Create new document with only first page
    const newDoc = await PDFDocument.create();
    const [firstPage] = await newDoc.copyPages(pdfDoc, [0]);
    newDoc.addPage(firstPage);

    return newDoc;
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  }

  private formatTime(timeStr: string): string {
    if (!timeStr) return '';
    return timeStr;
  }

  async generateICS202(data: ICSFormData): Promise<Uint8Array> {
    const pdfDoc = await this.loadTemplate(ics202TemplateUrl);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { width, height } = firstPage.getSize();

    // Fill in header information
    // 1. Incident Name
    firstPage.drawText(data.iapData?.incidentName || '', {
      x: 120,
      y: height - 70,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    // 2. Incident Number
    firstPage.drawText(data.iapData?.incidentNumber || '', {
      x: 455,
      y: height - 70,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    // 3. Operational Period Date/Time
    const fromDate = this.formatDate(data.periodData?.startDate);
    const fromTime = this.formatTime(data.periodData?.startTime);
    const toDate = this.formatDate(data.periodData?.endDate);
    const toTime = this.formatTime(data.periodData?.endTime);

    firstPage.drawText(`${fromDate}`, {
      x: 120,
      y: height - 94,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(`${fromTime}`, {
      x: 220,
      y: height - 94,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(`${toDate}`, {
      x: 320,
      y: height - 94,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(`${toTime}`, {
      x: 420,
      y: height - 94,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    // 4. Objectives - starting around y: 600 (height - 120)
    const objectives = data.formData || [];
    let yPos = height - 145;

    objectives.slice(0, 5).forEach((obj: any, idx: number) => {
      const text = obj.description || '';
      // Wrap text if too long
      const maxWidth = 500;
      const words = text.split(' ');
      let line = '';

      words.forEach((word: string) => {
        const testLine = line + word + ' ';
        const testWidth = font.widthOfTextAtSize(testLine, 9);

        if (testWidth > maxWidth && line !== '') {
          firstPage.drawText(line.trim(), {
            x: 50,
            y: yPos,
            size: 9,
            font: font,
            color: rgb(0, 0, 0),
          });
          line = word + ' ';
          yPos -= 12;
        } else {
          line = testLine;
        }
      });

      if (line.trim() !== '') {
        firstPage.drawText(line.trim(), {
          x: 50,
          y: yPos,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });
      }
      yPos -= 20;
    });

    // Footer - Prepared by and Date/Time
    firstPage.drawText(data.iapData?.preparedBy || '', {
      x: 120,
      y: 65,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    const now = new Date();
    firstPage.drawText(now.toLocaleDateString() + ' ' + now.toLocaleTimeString(), {
      x: 400,
      y: 65,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    return await pdfDoc.save();
  }

  async generateICS203(data: ICSFormData): Promise<Uint8Array> {
    const pdfDoc = await this.loadTemplate(ics203TemplateUrl);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { width, height } = firstPage.getSize();

    // Header information
    firstPage.drawText(data.iapData?.incidentName || '', {
      x: 120,
      y: height - 70,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(data.iapData?.incidentNumber || '', {
      x: 455,
      y: height - 70,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    const fromDate = this.formatDate(data.periodData?.startDate);
    const fromTime = this.formatTime(data.periodData?.startTime);
    const toDate = this.formatDate(data.periodData?.endDate);
    const toTime = this.formatTime(data.periodData?.endTime);

    firstPage.drawText(`${fromDate} ${fromTime}`, {
      x: 120,
      y: height - 94,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(`${toDate} ${toTime}`, {
      x: 320,
      y: height - 94,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Organization assignments table
    const orgData = data.formData || [];
    let yPos = height - 160;

    orgData.slice(0, 20).forEach((item: any) => {
      firstPage.drawText(item.position || '', {
        x: 50,
        y: yPos,
        size: 8,
        font: font,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(item.name || '', {
        x: 200,
        y: yPos,
        size: 8,
        font: font,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(item.contact || '', {
        x: 350,
        y: yPos,
        size: 8,
        font: font,
        color: rgb(0, 0, 0),
      });

      yPos -= 20;
    });

    // Footer
    firstPage.drawText(data.iapData?.preparedBy || '', {
      x: 120,
      y: 65,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    const now = new Date();
    firstPage.drawText(now.toLocaleDateString() + ' ' + now.toLocaleTimeString(), {
      x: 400,
      y: 65,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    return await pdfDoc.save();
  }

  async generateICS204(data: ICSFormData): Promise<Uint8Array> {
    const pdfDoc = await this.loadTemplate(ics204TemplateUrl);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { width, height } = firstPage.getSize();

    // Header information
    firstPage.drawText(data.iapData?.incidentName || '', {
      x: 180,
      y: height - 53,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(data.iapData?.incidentNumber || '', {
      x: 455,
      y: height - 53,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    const fromDate = this.formatDate(data.periodData?.startDate);
    const fromTime = this.formatTime(data.periodData?.startTime);
    const toDate = this.formatDate(data.periodData?.endDate);
    const toTime = this.formatTime(data.periodData?.endTime);

    firstPage.drawText(`${fromDate} ${fromTime}`, {
      x: 180,
      y: height - 74,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(`${toDate} ${toTime}`, {
      x: 380,
      y: height - 74,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Assignments
    const assignments = data.formData || [];
    let yPos = height - 200;

    assignments.slice(0, 10).forEach((item: any) => {
      firstPage.drawText(item.division || '', {
        x: 50,
        y: yPos,
        size: 8,
        font: font,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(item.assignment || '', {
        x: 150,
        y: yPos,
        size: 8,
        font: font,
        color: rgb(0, 0, 0),
      });

      yPos -= 20;
    });

    // Footer
    firstPage.drawText(data.iapData?.preparedBy || '', {
      x: 120,
      y: 65,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    return await pdfDoc.save();
  }

  async generateICS205(data: ICSFormData): Promise<Uint8Array> {
    const pdfDoc = await this.loadTemplate(ics205TemplateUrl);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { width, height } = firstPage.getSize();

    // Header
    firstPage.drawText(data.iapData?.incidentName || '', {
      x: 120,
      y: height - 70,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(data.iapData?.incidentNumber || '', {
      x: 650,
      y: height - 70,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    const fromDate = this.formatDate(data.periodData?.startDate);
    const fromTime = this.formatTime(data.periodData?.startTime);
    const toDate = this.formatDate(data.periodData?.endDate);
    const toTime = this.formatTime(data.periodData?.endTime);

    firstPage.drawText(`${fromDate} ${fromTime}`, {
      x: 120,
      y: height - 94,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(`${toDate} ${toTime}`, {
      x: 420,
      y: height - 94,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Communications table
    const comms = data.formData || [];
    let yPos = height - 180;

    comms.slice(0, 15).forEach((item: any) => {
      firstPage.drawText(item.function || '', {
        x: 50,
        y: yPos,
        size: 7,
        font: font,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(item.channel || '', {
        x: 180,
        y: yPos,
        size: 7,
        font: font,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(item.frequency || '', {
        x: 320,
        y: yPos,
        size: 7,
        font: font,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(item.mode || '', {
        x: 450,
        y: yPos,
        size: 7,
        font: font,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(item.remarks || '', {
        x: 520,
        y: yPos,
        size: 7,
        font: font,
        color: rgb(0, 0, 0),
      });

      yPos -= 18;
    });

    return await pdfDoc.save();
  }

  async generateICS205A(data: ICSFormData): Promise<Uint8Array> {
    const pdfDoc = await this.loadTemplate(ics205aTemplateUrl);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { width, height } = firstPage.getSize();

    // Header
    firstPage.drawText(data.iapData?.incidentName || '', {
      x: 120,
      y: height - 70,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(data.iapData?.incidentNumber || '', {
      x: 455,
      y: height - 70,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    const fromDate = this.formatDate(data.periodData?.startDate);
    const fromTime = this.formatTime(data.periodData?.startTime);
    const toDate = this.formatDate(data.periodData?.endDate);
    const toTime = this.formatTime(data.periodData?.endTime);

    firstPage.drawText(`${fromDate} ${fromTime}`, {
      x: 120,
      y: height - 94,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(`${toDate} ${toTime}`, {
      x: 320,
      y: height - 94,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Communications list
    const comms = data.formData || [];
    let yPos = height - 160;

    comms.slice(0, 20).forEach((item: any) => {
      firstPage.drawText(item.name || item.function || '', {
        x: 50,
        y: yPos,
        size: 8,
        font: font,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(item.method || '', {
        x: 220,
        y: yPos,
        size: 8,
        font: font,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(item.contact || '', {
        x: 350,
        y: yPos,
        size: 8,
        font: font,
        color: rgb(0, 0, 0),
      });

      yPos -= 20;
    });

    return await pdfDoc.save();
  }

  async generateICS206(data: ICSFormData): Promise<Uint8Array> {
    const pdfDoc = await this.loadTemplate(ics206TemplateUrl);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { width, height } = firstPage.getSize();

    // Header
    firstPage.drawText(data.iapData?.incidentName || '', {
      x: 120,
      y: height - 70,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(data.iapData?.incidentNumber || '', {
      x: 650,
      y: height - 70,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    const fromDate = this.formatDate(data.periodData?.startDate);
    const fromTime = this.formatTime(data.periodData?.startTime);
    const toDate = this.formatDate(data.periodData?.endDate);
    const toTime = this.formatTime(data.periodData?.endTime);

    firstPage.drawText(`${fromDate} ${fromTime}`, {
      x: 120,
      y: height - 94,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(`${toDate} ${toTime}`, {
      x: 420,
      y: height - 94,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Medical facilities
    const medical = data.formData || [];
    let yPos = height - 180;

    medical.slice(0, 10).forEach((item: any) => {
      firstPage.drawText(item.name || '', {
        x: 50,
        y: yPos,
        size: 7,
        font: font,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(item.type || '', {
        x: 150,
        y: yPos,
        size: 7,
        font: font,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(item.address || '', {
        x: 250,
        y: yPos,
        size: 7,
        font: font,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(item.contact || '', {
        x: 450,
        y: yPos,
        size: 7,
        font: font,
        color: rgb(0, 0, 0),
      });

      yPos -= 20;
    });

    return await pdfDoc.save();
  }

  async generateICS207(data: ICSFormData): Promise<Uint8Array> {
    const pdfDoc = await this.loadTemplate(ics207TemplateUrl);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { width, height } = firstPage.getSize();

    // Header
    firstPage.drawText(data.iapData?.incidentName || '', {
      x: 120,
      y: height - 70,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(data.iapData?.incidentNumber || '', {
      x: 650,
      y: height - 70,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    const fromDate = this.formatDate(data.periodData?.startDate);
    const fromTime = this.formatTime(data.periodData?.startTime);
    const toDate = this.formatDate(data.periodData?.endDate);
    const toTime = this.formatTime(data.periodData?.endTime);

    firstPage.drawText(`${fromDate} ${fromTime}`, {
      x: 120,
      y: height - 94,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(`${toDate} ${toTime}`, {
      x: 420,
      y: height - 94,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Organization chart - fill in key positions
    const orgData = data.formData || [];

    // Map positions to locations on the org chart
    const positionMap: { [key: string]: { x: number; y: number } } = {
      'Incident Commander': { x: 370, y: height - 180 },
      'Safety Officer': { x: 150, y: height - 250 },
      'Public Information Officer': { x: 250, y: height - 250 },
      'Liaison Officer': { x: 350, y: height - 250 },
      'Operations Section Chief': { x: 150, y: height - 350 },
      'Planning Section Chief': { x: 280, y: height - 350 },
      'Logistics Section Chief': { x: 410, y: height - 350 },
      'Finance/Admin Section Chief': { x: 540, y: height - 350 },
    };

    orgData.forEach((item: any) => {
      const position = positionMap[item.position];
      if (position) {
        firstPage.drawText(item.name || '', {
          x: position.x,
          y: position.y,
          size: 8,
          font: font,
          color: rgb(0, 0, 0),
        });
      }
    });

    return await pdfDoc.save();
  }

  async generateICS208(data: ICSFormData): Promise<Uint8Array> {
    const pdfDoc = await this.loadTemplate(ics208TemplateUrl);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { width, height } = firstPage.getSize();

    // Header
    firstPage.drawText(data.iapData?.incidentName || '', {
      x: 120,
      y: height - 70,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(data.iapData?.incidentNumber || '', {
      x: 455,
      y: height - 70,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    const fromDate = this.formatDate(data.periodData?.startDate);
    const fromTime = this.formatTime(data.periodData?.startTime);
    const toDate = this.formatDate(data.periodData?.endDate);
    const toTime = this.formatTime(data.periodData?.endTime);

    firstPage.drawText(`${fromDate} ${fromTime}`, {
      x: 120,
      y: height - 94,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(`${toDate} ${toTime}`, {
      x: 320,
      y: height - 94,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Safety messages
    const safety = data.formData || [];
    let yPos = height - 160;

    safety.slice(0, 10).forEach((item: any, idx: number) => {
      const text = item.message || item.hazard || '';
      firstPage.drawText(`${idx + 1}. ${text}`, {
        x: 50,
        y: yPos,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });

      if (item.mitigation) {
        yPos -= 12;
        firstPage.drawText(`   Mitigation: ${item.mitigation}`, {
          x: 50,
          y: yPos,
          size: 8,
          font: font,
          color: rgb(0, 0, 0),
        });
      }

      yPos -= 25;
    });

    return await pdfDoc.save();
  }
}

export const pdfGeneratorV2 = new PDFGeneratorV2();

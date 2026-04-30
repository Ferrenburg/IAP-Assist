import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ICSFormData {
  iapData: any;
  periodData: any;
  formData?: any;
}

export class PDFGenerator {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });
  }

  private addHeader(formCode: string, formTitle: string, data: ICSFormData) {
    const { iapData, periodData } = data;

    // Form header
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(formCode, 15, 15);
    this.doc.text(formTitle, 105, 15, { align: 'center' });

    // Incident information
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');

    const startY = 25;
    this.doc.text(`1. Incident Name:`, 15, startY);
    this.doc.text(iapData?.incidentName || '', 55, startY);

    this.doc.text(`2. Operational Period:`, 15, startY + 5);
    const dateFrom = periodData?.startDate ? new Date(periodData.startDate).toLocaleDateString() : '';
    const dateTo = periodData?.endDate ? new Date(periodData.endDate).toLocaleDateString() : '';
    this.doc.text(`Date From: ${dateFrom} Time: ${periodData?.startTime || ''}`, 55, startY + 5);
    this.doc.text(`Date To: ${dateTo} Time: ${periodData?.endTime || ''}`, 55, startY + 10);

    return startY + 20;
  }

  private addFooter(preparedBy: string = '') {
    const pageHeight = this.doc.internal.pageSize.height;
    this.doc.setFontSize(8);
    this.doc.text(`Prepared by: ${preparedBy}`, 15, pageHeight - 20);
    this.doc.text(`Date/Time: ${new Date().toLocaleString()}`, 15, pageHeight - 15);
    this.doc.text(`ICS ${this.doc.internal.getCurrentPageInfo().pageNumber}`, 15, pageHeight - 10);
  }

  generateICS202(data: ICSFormData): Uint8Array {
    this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

    const startY = this.addHeader('ICS 202', 'INCIDENT OBJECTIVES', data);

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('3. Incident Objectives:', 15, startY);

    const objectives = data.formData || [];
    let currentY = startY + 7;

    this.doc.setFont('helvetica', 'normal');
    objectives.forEach((obj: any, idx: number) => {
      if (currentY > 240) {
        this.doc.addPage();
        currentY = 20;
      }

      this.doc.text(`${idx + 1}. ${obj.description || ''}`, 15, currentY);
      currentY += 7;
    });

    if (objectives.length === 0) {
      this.doc.setFont('helvetica', 'italic');
      this.doc.text('No objectives defined', 15, currentY);
    }

    this.addFooter(data.iapData?.preparedBy || '');
    return this.doc.output('arraybuffer');
  }

  generateICS203(data: ICSFormData): Uint8Array {
    this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

    const startY = this.addHeader('ICS 203', 'ORGANIZATION ASSIGNMENT LIST', data);

    const orgData = data.formData || [];

    const tableData = orgData.map((item: any) => [
      item.position || '',
      item.name || '',
      item.contact || ''
    ]);

    autoTable(this.doc, {
      startY: startY,
      head: [['Position', 'Name', 'Contact Information']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [100, 100, 100] }
    });

    this.addFooter(data.iapData?.preparedBy || '');
    return this.doc.output('arraybuffer');
  }

  generateICS204(data: ICSFormData): Uint8Array {
    this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

    const startY = this.addHeader('ICS 204', 'ASSIGNMENT LIST', data);

    const assignments = data.formData || [];

    const tableData = assignments.map((item: any) => [
      item.division || '',
      item.assignment || '',
      item.resources || '',
      item.reportingLocation || ''
    ]);

    autoTable(this.doc, {
      startY: startY,
      head: [['Division/Group', 'Assignment', 'Resources', 'Reporting Location']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [100, 100, 100] }
    });

    this.addFooter(data.iapData?.preparedBy || '');
    return this.doc.output('arraybuffer');
  }

  generateICS205(data: ICSFormData): Uint8Array {
    this.doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });

    const startY = this.addHeader('ICS 205', 'INCIDENT RADIO COMMUNICATIONS PLAN', data);

    const comms = data.formData || [];

    const tableData = comms.map((item: any) => [
      item.function || '',
      item.channel || '',
      item.frequency || '',
      item.mode || '',
      item.remarks || ''
    ]);

    autoTable(this.doc, {
      startY: startY,
      head: [['Function', 'Channel Name/Trunked Group', 'Frequency/Tone', 'Mode (A, D, or M)', 'Remarks']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 7 },
      headStyles: { fillColor: [100, 100, 100] }
    });

    this.addFooter(data.iapData?.preparedBy || '');
    return this.doc.output('arraybuffer');
  }

  generateICS205A(data: ICSFormData): Uint8Array {
    this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

    const startY = this.addHeader('ICS 205A', 'COMMUNICATIONS LIST', data);

    const comms = data.formData || [];

    const tableData = comms.map((item: any) => [
      item.name || '',
      item.method || '',
      item.contact || ''
    ]);

    autoTable(this.doc, {
      startY: startY,
      head: [['Name/Function', 'Method of Contact', 'Contact Information']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [100, 100, 100] }
    });

    this.addFooter(data.iapData?.preparedBy || '');
    return this.doc.output('arraybuffer');
  }

  generateICS206(data: ICSFormData): Uint8Array {
    this.doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });

    const startY = this.addHeader('ICS 206', 'MEDICAL PLAN', data);

    const medical = data.formData || [];

    const tableData = medical.map((item: any) => [
      item.name || '',
      item.type || '',
      item.address || '',
      item.contact || '',
      item.paramedics || '',
      item.latitude || '',
      item.longitude || ''
    ]);

    autoTable(this.doc, {
      startY: startY,
      head: [['Medical Aid Station', 'Type', 'Location/Address', 'Contact', 'Paramedics (Y/N)', 'Latitude', 'Longitude']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 7 },
      headStyles: { fillColor: [100, 100, 100] }
    });

    this.addFooter(data.iapData?.preparedBy || '');
    return this.doc.output('arraybuffer');
  }

  generateICS207(data: ICSFormData): Uint8Array {
    this.doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });

    const startY = this.addHeader('ICS 207', 'INCIDENT ORGANIZATION CHART', data);

    this.doc.setFontSize(9);
    this.doc.text('Organization Chart', 15, startY);

    const orgData = data.formData || [];
    let currentY = startY + 10;

    // Create a simple hierarchical view
    this.doc.setFontSize(8);
    orgData.forEach((item: any) => {
      if (currentY > 180) {
        this.doc.addPage();
        currentY = 20;
      }

      this.doc.setFont('helvetica', 'bold');
      this.doc.text(item.position || '', 15, currentY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(item.name || '', 80, currentY);
      currentY += 7;
    });

    this.addFooter(data.iapData?.preparedBy || '');
    return this.doc.output('arraybuffer');
  }

  generateICS208(data: ICSFormData): Uint8Array {
    this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

    const startY = this.addHeader('ICS 208', 'SAFETY MESSAGE/PLAN', data);

    const safety = data.formData || [];

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Safety Messages and Hazards:', 15, startY);

    let currentY = startY + 7;
    this.doc.setFont('helvetica', 'normal');

    safety.forEach((item: any, idx: number) => {
      if (currentY > 240) {
        this.doc.addPage();
        currentY = 20;
      }

      this.doc.text(`${idx + 1}. ${item.message || item.hazard || ''}`, 15, currentY);
      if (item.mitigation) {
        currentY += 5;
        this.doc.text(`   Mitigation: ${item.mitigation}`, 15, currentY);
      }
      currentY += 7;
    });

    if (safety.length === 0) {
      this.doc.setFont('helvetica', 'italic');
      this.doc.text('No safety information defined', 15, currentY);
    }

    this.addFooter(data.iapData?.preparedBy || '');
    return this.doc.output('arraybuffer');
  }
}

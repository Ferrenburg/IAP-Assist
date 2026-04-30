import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ICS_202_BLOCKS } from '../field-mappings';
import {
  loadTemplateFirstPage,
  createContinuationPage,
  formatDate,
  formatTime,
  formatDateTime,
  drawCheckbox,
  drawWrappedText,
  drawPageNumber,
  addOpPeriodFooter,
} from '../pdf-helpers';
import { TEMPLATE_URLS } from '../templates';

export interface ICS202Data {
  // Block 1
  incidentName: string;
  incidentNumber?: string;

  // Block 2
  operationalPeriod: {
    dateFrom: string;
    timeFrom: string;
    dateTo: string;
    timeTo: string;
  };

  // Block 3
  objectives: Array<{ description: string }>;

  // Block 4
  commandEmphasis?: string;
  situationalAwareness?: string;

  // Block 5
  siteSafetyPlanRequired?: boolean;
  siteSafetyPlanLocation?: string;

  // Block 6
  iapAttachments?: {
    ics203?: boolean;
    ics204?: boolean;
    ics205?: boolean;
    ics205a?: boolean;
    ics206?: boolean;
    ics207?: boolean;
    ics208?: boolean;
    map?: boolean;
    weather?: boolean;
    other?: string;
  };

  // Block 7
  preparedBy: {
    name: string;
    position: string;
    dateTime?: string;
  };

  // Block 8
  approvedBy?: {
    name: string;
  };
}

export async function generateICS202(data: ICS202Data): Promise<Uint8Array> {
  const TEMPLATE_PATH = TEMPLATE_URLS.ICS_202;
  const pdfDoc = await loadTemplateFirstPage(TEMPLATE_PATH);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let currentPage = pdfDoc.getPages()[0];
  const { height } = currentPage.getSize();
  let pageNumber = 1;

  // BLOCK 1: Incident Name
  if (data.incidentName) {
    currentPage.drawText(data.incidentName, {
      x: ICS_202_BLOCKS.incidentName.x,
      y: ICS_202_BLOCKS.incidentName.y,
      size: ICS_202_BLOCKS.incidentName.fontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
      maxWidth: ICS_202_BLOCKS.incidentName.maxWidth,
    });
  }

  // BLOCK 2: Operational Period
  currentPage.drawText(formatDate(data.operationalPeriod.dateFrom), {
    x: ICS_202_BLOCKS.opPeriodDateFrom.x,
    y: ICS_202_BLOCKS.opPeriodDateFrom.y,
    size: ICS_202_BLOCKS.opPeriodDateFrom.fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  currentPage.drawText(formatTime(data.operationalPeriod.timeFrom), {
    x: ICS_202_BLOCKS.opPeriodTimeFrom.x,
    y: ICS_202_BLOCKS.opPeriodTimeFrom.y,
    size: ICS_202_BLOCKS.opPeriodTimeFrom.fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  currentPage.drawText(formatDate(data.operationalPeriod.dateTo), {
    x: ICS_202_BLOCKS.opPeriodDateTo.x,
    y: ICS_202_BLOCKS.opPeriodDateTo.y,
    size: ICS_202_BLOCKS.opPeriodDateTo.fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  currentPage.drawText(formatTime(data.operationalPeriod.timeTo), {
    x: ICS_202_BLOCKS.opPeriodTimeTo.x,
    y: ICS_202_BLOCKS.opPeriodTimeTo.y,
    size: ICS_202_BLOCKS.opPeriodTimeTo.fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  // BLOCK 3: Objectives
  let yPos = ICS_202_BLOCKS.objectivesStart.y;
  const maxObjectivesYPos = 385; // Don't go below this on page 1

  for (let i = 0; i < data.objectives.length; i++) {
    const objective = data.objectives[i];

    // Check if we need a continuation page
    if (yPos < maxObjectivesYPos && i < data.objectives.length) {
      // Create continuation page
      pageNumber++;
      currentPage = await createContinuationPage(pdfDoc, TEMPLATE_PATH);
      yPos = ICS_202_BLOCKS.objectivesStart.y;

      // Re-add header info to continuation page
      currentPage.drawText(data.incidentName, {
        x: ICS_202_BLOCKS.incidentName.x,
        y: ICS_202_BLOCKS.incidentName.y,
        size: ICS_202_BLOCKS.incidentName.fontSize,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
    }

    const objectiveText = `${i + 1}. ${objective.description}`;

    yPos = drawWrappedText(
      currentPage,
      objectiveText,
      ICS_202_BLOCKS.objectivesStart.x,
      yPos,
      font,
      ICS_202_BLOCKS.objectivesStart.fontSize || 10,
      ICS_202_BLOCKS.objectivesStart.maxWidth || 520,
      ICS_202_BLOCKS.objectiveLineHeight
    );

    yPos -= 10; // Extra space between objectives
  }

  // Go back to first page for remaining blocks
  currentPage = pdfDoc.getPages()[0];

  // BLOCK 4: Command Emphasis
  if (data.commandEmphasis) {
    drawWrappedText(
      currentPage,
      data.commandEmphasis,
      ICS_202_BLOCKS.commandEmphasisStart.x,
      ICS_202_BLOCKS.commandEmphasisStart.y,
      font,
      ICS_202_BLOCKS.commandEmphasisStart.fontSize || 9,
      ICS_202_BLOCKS.commandEmphasisStart.maxWidth || 520,
      12
    );
  }

  // BLOCK 4: Situational Awareness
  if (data.situationalAwareness) {
    drawWrappedText(
      currentPage,
      data.situationalAwareness,
      ICS_202_BLOCKS.situationalAwarenessStart.x,
      ICS_202_BLOCKS.situationalAwarenessStart.y,
      font,
      ICS_202_BLOCKS.situationalAwarenessStart.fontSize || 9,
      ICS_202_BLOCKS.situationalAwarenessStart.maxWidth || 520,
      12
    );
  }

  // BLOCK 5: Site Safety Plan
  if (data.siteSafetyPlanRequired !== undefined && data.siteSafetyPlanRequired !== null) {
    const yesX = ICS_202_BLOCKS.siteSafetyPlanRequired.x;
    const noX = yesX + 30;
    const checkY = ICS_202_BLOCKS.siteSafetyPlanRequired.y;

    drawCheckbox(currentPage, yesX, checkY, 8, data.siteSafetyPlanRequired === true);
    drawCheckbox(currentPage, noX, checkY, 8, data.siteSafetyPlanRequired === false);
  }

  if (data.siteSafetyPlanLocation) {
    currentPage.drawText(data.siteSafetyPlanLocation, {
      x: ICS_202_BLOCKS.siteSafetyPlanLocation.x,
      y: ICS_202_BLOCKS.siteSafetyPlanLocation.y,
      size: ICS_202_BLOCKS.siteSafetyPlanLocation.fontSize || 9,
      font: font,
      color: rgb(0, 0, 0),
      maxWidth: ICS_202_BLOCKS.siteSafetyPlanLocation.maxWidth,
    });
  }

  // BLOCK 6: IAP Attachments (checkboxes)
  if (data.iapAttachments) {
    const checkSize = 8;

    if (data.iapAttachments.ics203) {
      drawCheckbox(currentPage, ICS_202_BLOCKS.attachmentICS203.x, ICS_202_BLOCKS.attachmentICS203.y, checkSize, true);
    }
    if (data.iapAttachments.ics204) {
      drawCheckbox(currentPage, ICS_202_BLOCKS.attachmentICS204.x, ICS_202_BLOCKS.attachmentICS204.y, checkSize, true);
    }
    if (data.iapAttachments.ics205) {
      drawCheckbox(currentPage, ICS_202_BLOCKS.attachmentICS205.x, ICS_202_BLOCKS.attachmentICS205.y, checkSize, true);
    }
    if (data.iapAttachments.ics205a) {
      drawCheckbox(currentPage, ICS_202_BLOCKS.attachmentICS205A.x, ICS_202_BLOCKS.attachmentICS205A.y, checkSize, true);
    }
    if (data.iapAttachments.ics206) {
      drawCheckbox(currentPage, ICS_202_BLOCKS.attachmentICS206.x, ICS_202_BLOCKS.attachmentICS206.y, checkSize, true);
    }
    if (data.iapAttachments.ics207) {
      drawCheckbox(currentPage, ICS_202_BLOCKS.attachmentICS207.x, ICS_202_BLOCKS.attachmentICS207.y, checkSize, true);
    }
    if (data.iapAttachments.ics208) {
      drawCheckbox(currentPage, ICS_202_BLOCKS.attachmentICS208.x, ICS_202_BLOCKS.attachmentICS208.y, checkSize, true);
    }
    if (data.iapAttachments.map) {
      drawCheckbox(currentPage, ICS_202_BLOCKS.attachmentMap.x, ICS_202_BLOCKS.attachmentMap.y, checkSize, true);
    }
    if (data.iapAttachments.weather) {
      drawCheckbox(currentPage, ICS_202_BLOCKS.attachmentWeather.x, ICS_202_BLOCKS.attachmentWeather.y, checkSize, true);
    }

    if (data.iapAttachments.other) {
      currentPage.drawText(data.iapAttachments.other, {
        x: ICS_202_BLOCKS.otherAttachments1.x,
        y: ICS_202_BLOCKS.otherAttachments1.y,
        size: ICS_202_BLOCKS.otherAttachments1.fontSize,
        font: font,
        color: rgb(0, 0, 0),
        maxWidth: ICS_202_BLOCKS.otherAttachments1.maxWidth,
      });
    }
  }

  // BLOCK 7: Prepared by
  currentPage.drawText(data.preparedBy.name, {
    x: ICS_202_BLOCKS.preparedByName.x,
    y: ICS_202_BLOCKS.preparedByName.y,
    size: ICS_202_BLOCKS.preparedByName.fontSize,
    font: font,
    color: rgb(0, 0, 0),
    maxWidth: ICS_202_BLOCKS.preparedByName.maxWidth,
  });

  currentPage.drawText(data.preparedBy.position, {
    x: ICS_202_BLOCKS.preparedByPosition.x,
    y: ICS_202_BLOCKS.preparedByPosition.y,
    size: ICS_202_BLOCKS.preparedByPosition.fontSize,
    font: font,
    color: rgb(0, 0, 0),
    maxWidth: ICS_202_BLOCKS.preparedByPosition.maxWidth,
  });

  // Prepared by date/time if provided
  if (data.preparedBy.dateTime) {
    const preparedDateTime = formatDateTime(
      data.preparedBy.dateTime.split('T')[0],
      data.preparedBy.dateTime.split('T')[1]?.substring(0, 5) || ''
    );
    currentPage.drawText(preparedDateTime, {
      x: ICS_202_BLOCKS.preparedByDateTime.x,
      y: ICS_202_BLOCKS.preparedByDateTime.y,
      size: ICS_202_BLOCKS.preparedByDateTime.fontSize,
      font: font,
      color: rgb(0, 0, 0),
      maxWidth: ICS_202_BLOCKS.preparedByDateTime.maxWidth,
    });
  }

  // BLOCK 8: Approved by IC
  if (data.approvedBy) {
    currentPage.drawText(data.approvedBy.name, {
      x: ICS_202_BLOCKS.approvedByName.x,
      y: ICS_202_BLOCKS.approvedByName.y,
      size: ICS_202_BLOCKS.approvedByName.fontSize || 9,
      font: font,
      color: rgb(0, 0, 0),
      maxWidth: ICS_202_BLOCKS.approvedByName.maxWidth,
    });
  }

  // Add page numbers if multiple pages
  if (pdfDoc.getPageCount() > 1) {
    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      drawPageNumber(pages[i], i + 1, pages.length, 'ICS 202');
    }
  }

  // Add OpPeriod footer to all pages
  const pages = pdfDoc.getPages();
  const footerFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  for (const page of pages) {
    addOpPeriodFooter(page, footerFont);
  }

  return await pdfDoc.save();
}

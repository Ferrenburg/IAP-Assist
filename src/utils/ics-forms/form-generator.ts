import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { generateICS202, ICS202Data } from './generators/ics-202';
import {
  ICS_203_BLOCKS,
  ICS_204_BLOCKS,
  ICS_205_BLOCKS,
  ICS_205A_BLOCKS,
  ICS_206_BLOCKS,
  ICS_207_BLOCKS,
  ICS_208_BLOCKS,
} from './field-mappings';
import {
  loadTemplateFirstPage,
  createContinuationPage,
  formatDate,
  formatTime,
  formatDateTime,
  drawTableCell,
  drawWrappedText,
  drawBoundedText,
  drawCheckbox,
  drawPageNumber,
  addOpPeriodFooter,
  sanitizeText,
  wrapText,
} from './pdf-helpers';
import { validateFormFields } from './field-validator';
import { DEBUG_MODE, drawBlockBoundaries, drawCoordinateGrid } from './debug-mode';
import { TEMPLATE_URLS } from './templates';

export interface ICSFormData {
  iapData: any;
  periodData: any;
  formData?: any;
  organizationData?: any;
  safetyData?: any;
  safetyFormData?: any;
  branchesData?: any;
  commandEmphasis?: string;
  situationConditions?: string;
  operationsSectionChief?: string;
  operationsSectionChiefContact?: string;
  branchDirector?: string;
  branchDirectorContact?: string;
  divisionSupervisorContact?: string;
  iapPageNumber?: string | number;
  preparedBy?: string;
  preparedByPosition?: string;
  preparedDateTime?: string;
}

export class ICSFormGenerator {
  // Splits an ISO timestamp ("2025-05-01T06:00:00") into date and time parts
  // for use with formatDate / formatTime in pdf-helpers. Falls back to the
  // legacy separate-field shape that the old KV data used.
  private isoDate(iso: string | null | undefined, legacy?: string): string {
    if (legacy) return legacy;
    if (!iso) return '';
    return iso.split('T')[0]; // "2025-05-01"
  }

  private isoTime(iso: string | null | undefined, legacy?: string): string {
    if (legacy) return legacy;
    if (!iso) return '';
    return iso.split('T')[1]?.substring(0, 5) || ''; // "06:00"
  }

  async generateICS202(data: ICSFormData): Promise<Uint8Array> {
    // Use IC name from iapData if available, otherwise extract from organization data
    const icName = data.iapData?.incidentCommanderName ||
      data.organizationData?.find((item: any) => item.position === 'Incident Commander')?.name || '';

    // Extract  name from organization data
    const pscName = data.organizationData?.find((item: any) => item.position === '')?.name || '';

    const ics202Data: ICS202Data = {
      incidentName: data.iapData?.incidentName || data.iapData?.name || '',
      incidentNumber: data.iapData?.incidentNumber || '',
      operationalPeriod: {
        dateFrom: this.isoDate(data.periodData?.startAt, data.periodData?.fromDate),
        timeFrom: this.isoTime(data.periodData?.startAt, data.periodData?.fromTime),
        dateTo: this.isoDate(data.periodData?.endAt, data.periodData?.toDate),
        timeTo: this.isoTime(data.periodData?.endAt, data.periodData?.toTime),
      },
      objectives: data.formData || [],
      commandEmphasis: data.commandEmphasis || '',
      situationalAwareness: data.situationConditions || '',
      siteSafetyPlanRequired: data.safetyFormData?.siteSafetyPlanRequired,
      siteSafetyPlanLocation: data.safetyFormData?.siteSafetyPlanLocation || '',
      preparedBy: {
        name: data.iapData?.preparedBy || pscName,
        position: data.iapData?.preparedByPosition || '',
        dateTime: data.iapData?.preparedDateTime,
      },
      approvedBy: icName ? {
        name: icName,
      } : undefined,
      iapAttachments: {
        ics203: true,
        ics204: true,
        ics205: true,
        ics205a: true,
        ics206: true,
        ics207: true,
        ics208: true,
      },
    };

    return await generateICS202(ics202Data);
  }

  async generateICS203(data: ICSFormData): Promise<Uint8Array> {
    // Validate required fields have proper anchors
    const validation = validateFormFields('ICS 203', [
      { blockNumber: '1', fieldLabel: 'incidentName', position: ICS_203_BLOCKS.incidentName },
      { blockNumber: '2', fieldLabel: 'opPeriodFrom', position: ICS_203_BLOCKS.opPeriodFrom },
      { blockNumber: '2', fieldLabel: 'opPeriodTo', position: ICS_203_BLOCKS.opPeriodTo },
      { blockNumber: '9', fieldLabel: 'preparedByName', position: ICS_203_BLOCKS.preparedByName },
    ]);

    if (!validation.isValid) {
      console.error('ICS 203 field validation failed:', validation.errors);
      validation.errors.forEach(err => {
        console.error(`  Block ${err.blockNumber} - ${err.fieldLabel}: ${err.issue}`);
      });
    }

    const pdfDoc = await loadTemplateFirstPage(TEMPLATE_URLS.ICS_203);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.getPages()[0];

    // Debug mode: draw field boundaries
    if (DEBUG_MODE.enabled) {
      if (DEBUG_MODE.options.showCoordinateGrid) {
        drawCoordinateGrid(page, 50);
      }
      if (DEBUG_MODE.options.showFieldBoundaries) {
        drawBlockBoundaries(page, ICS_203_BLOCKS);
      }
    }

    // Block 1: Incident Name (bounded to header box)
    drawBoundedText(
      page,
      data.iapData?.incidentName || data.iapData?.incidentName || data.iapData?.name || '',
      ICS_203_BLOCKS.incidentName.x,
      ICS_203_BLOCKS.incidentName.y,
      font,
      ICS_203_BLOCKS.incidentName.fontSize || 10,
      ICS_203_BLOCKS.incidentName.maxWidth || 320
    );

    // Block 2: Operational Period — write date and time into separate rows so
    // they align with the "Date From / Time From" and "Date To / Time To" printed
    // labels on the form template (combined strings land between the two rows).
    const fromDate = this.isoDate(data.periodData?.startAt, data.periodData?.fromDate);
    const fromTime = this.isoTime(data.periodData?.startAt, data.periodData?.fromTime);
    const toDate   = this.isoDate(data.periodData?.endAt, data.periodData?.toDate);
    const toTime   = this.isoTime(data.periodData?.endAt, data.periodData?.toTime);

    drawBoundedText(page, formatDate(fromDate), ICS_203_BLOCKS.opPeriodDateFrom.x, ICS_203_BLOCKS.opPeriodDateFrom.y, font, ICS_203_BLOCKS.opPeriodDateFrom.fontSize || 9, ICS_203_BLOCKS.opPeriodDateFrom.maxWidth || 80);
    drawBoundedText(page, formatTime(fromTime), ICS_203_BLOCKS.opPeriodTimeFrom.x, ICS_203_BLOCKS.opPeriodTimeFrom.y, font, ICS_203_BLOCKS.opPeriodTimeFrom.fontSize || 9, ICS_203_BLOCKS.opPeriodTimeFrom.maxWidth || 60);
    drawBoundedText(page, formatDate(toDate),   ICS_203_BLOCKS.opPeriodDateTo.x,   ICS_203_BLOCKS.opPeriodDateTo.y,   font, ICS_203_BLOCKS.opPeriodDateTo.fontSize   || 9, ICS_203_BLOCKS.opPeriodDateTo.maxWidth   || 70);
    drawBoundedText(page, formatTime(toTime),   ICS_203_BLOCKS.opPeriodTimeTo.x,   ICS_203_BLOCKS.opPeriodTimeTo.y,   font, ICS_203_BLOCKS.opPeriodTimeTo.fontSize   || 9, ICS_203_BLOCKS.opPeriodTimeTo.maxWidth   || 70);

    // Block 3-8: Organization positions
    const orgData = data.formData || [];

    // Load branches and divisions for branch/division section
    const branchesData = data.branchesData || [];
    const divisionsData = data.divisionsData || [];

    // Agency rep slot definitions in outer scope so both renderOrganizationPositions
    // and the overflow continuation-page logic can reference the same array.
    const agencyRepSlots = [
      { agency: ICS_203_BLOCKS.agencyRep1Agency, name: ICS_203_BLOCKS.agencyRep1Name },
      { agency: ICS_203_BLOCKS.agencyRep2Agency, name: ICS_203_BLOCKS.agencyRep2Name },
      { agency: ICS_203_BLOCKS.agencyRep3Agency, name: ICS_203_BLOCKS.agencyRep3Name },
      { agency: ICS_203_BLOCKS.agencyRep4Agency, name: ICS_203_BLOCKS.agencyRep4Name },
      { agency: ICS_203_BLOCKS.agencyRep5Agency, name: ICS_203_BLOCKS.agencyRep5Name },
      { agency: ICS_203_BLOCKS.agencyRep6Agency, name: ICS_203_BLOCKS.agencyRep6Name },
    ];

    // Technical Specialist slot definitions in outer scope for overflow handling
    const techSpecPositions = [
      ICS_203_BLOCKS.technicalSpecialist1Name,
      ICS_203_BLOCKS.technicalSpecialist2Name,
      ICS_203_BLOCKS.technicalSpecialist3Name,
      ICS_203_BLOCKS.technicalSpecialist4Name,
    ];

    // Helper function to render organization positions
    const renderOrganizationPositions = (targetPage: PDFPage) => {
      const positionMap: { [key: string]: { x: number; y: number } } = {
        'Incident Commander': ICS_203_BLOCKS.incidentCommanderName,
        'Deputy Incident Commander': ICS_203_BLOCKS.deputyICName,
        'Safety Officer': ICS_203_BLOCKS.safetyOfficerName,
        'Public Information Officer': ICS_203_BLOCKS.publicInfoOfficerName,
        'Liaison Officer': ICS_203_BLOCKS.liaisonOfficerName,
        'Agency Representative': ICS_203_BLOCKS.agencyRep1Name,
        'Planning Section Chief': ICS_203_BLOCKS.planningChiefName,
        'Deputy Planning Section Chief': ICS_203_BLOCKS.planningDeputyName,
        'Planning Deputy': ICS_203_BLOCKS.planningDeputyName,
        'Resources Unit Leader': ICS_203_BLOCKS.resourcesUnitName,
        'Resources Unit': ICS_203_BLOCKS.resourcesUnitName,
        'Situation Unit Leader': ICS_203_BLOCKS.situationUnitName,
        'Situation Unit': ICS_203_BLOCKS.situationUnitName,
        'Documentation Unit Leader': ICS_203_BLOCKS.documentationUnitName,
        'Documentation Unit': ICS_203_BLOCKS.documentationUnitName,
        'Demobilization Unit Leader': ICS_203_BLOCKS.demobilizationUnitName,
        'Demobilization Unit': ICS_203_BLOCKS.demobilizationUnitName,
        'Technical Specialist': ICS_203_BLOCKS.technicalSpecialist1Name,
        'Logistics Section Chief': ICS_203_BLOCKS.logisticsChiefName,
        'Deputy Logistics Section Chief': ICS_203_BLOCKS.logisticsDeputyName,
        'Logistics Deputy': ICS_203_BLOCKS.logisticsDeputyName,
        'Support Branch Director': ICS_203_BLOCKS.supportBranchName,
        'Support Branch': ICS_203_BLOCKS.supportBranchName,
        'Supply Unit Leader': ICS_203_BLOCKS.supplyUnitName,
        'Supply Unit': ICS_203_BLOCKS.supplyUnitName,
        'Facilities Unit Leader': ICS_203_BLOCKS.facilitiesUnitName,
        'Facilities Unit': ICS_203_BLOCKS.facilitiesUnitName,
        'Ground Support Unit Leader': ICS_203_BLOCKS.groundSupportUnitName,
        'Ground Support Unit': ICS_203_BLOCKS.groundSupportUnitName,
        'Service Branch Director': ICS_203_BLOCKS.serviceBranchName,
        'Service Branch': ICS_203_BLOCKS.serviceBranchName,
        'Communications Unit Leader': ICS_203_BLOCKS.communicationsUnitName,
        'Communications Unit': ICS_203_BLOCKS.communicationsUnitName,
        'Medical Unit Leader': ICS_203_BLOCKS.medicalUnitName,
        'Medical Unit': ICS_203_BLOCKS.medicalUnitName,
        'Food Unit Leader': ICS_203_BLOCKS.foodUnitName,
        'Food Unit': ICS_203_BLOCKS.foodUnitName,
        'Operations Section Chief': ICS_203_BLOCKS.operationsChiefName,
        'Deputy Operations Section Chief': ICS_203_BLOCKS.operationsDeputyName,
        'Operations Deputy': ICS_203_BLOCKS.operationsDeputyName,
        'Staging Area Manager': ICS_203_BLOCKS.stagingAreaName,
        'Staging Area': ICS_203_BLOCKS.stagingAreaName,
        'Air Operations Branch Director': ICS_203_BLOCKS.airOpsBranchDirectorName,
        'Air Ops Branch Director': ICS_203_BLOCKS.airOpsBranchDirectorName,
        'Finance/Administration Section Chief': ICS_203_BLOCKS.financeChiefName,
        'Finance/Admin Section Chief': ICS_203_BLOCKS.financeChiefName,
        'Deputy Finance/Administration Section Chief': ICS_203_BLOCKS.financeDeputyName,
        'Finance Deputy': ICS_203_BLOCKS.financeDeputyName,
        'Time Unit Leader': ICS_203_BLOCKS.timeUnitName,
        'Time Unit': ICS_203_BLOCKS.timeUnitName,
        'Procurement Unit Leader': ICS_203_BLOCKS.procurementUnitName,
        'Procurement Unit': ICS_203_BLOCKS.procurementUnitName,
        'Compensation/Claims Unit Leader': ICS_203_BLOCKS.compClaimsUnitName,
        'Comp/Claims Unit': ICS_203_BLOCKS.compClaimsUnitName,
        'Cost Unit Leader': ICS_203_BLOCKS.costUnitName,
        'Cost Unit': ICS_203_BLOCKS.costUnitName,
      };

      // Handle multiple Incident Commanders for unified command (fill top-down)
      const icPositions = [
        ICS_203_BLOCKS.incidentCommanderName,
        ICS_203_BLOCKS.incidentCommanderName2,
        ICS_203_BLOCKS.incidentCommanderName3,
      ];
      const incidentCommanders = orgData.filter((item: any) => item.position === 'Incident Commander');
      incidentCommanders.forEach((item: any, index: number) => {
        if (index < icPositions.length && item.name) {
          const position = icPositions[index];
          if (position && position.x !== undefined) {
            drawBoundedText(
              targetPage,
              item.name,
              position.x,
              position.y,
              font,
              position.fontSize || 8,
              position.maxWidth || 240
            );
          }
        }
      });

      // Handle Agency Representatives — 6 slots per page (agencyRepSlots defined in outer scope).
      const agencyReps = orgData.filter((item: any) => item.position === 'Agency Representative');
      // Render the first batch (up to 6) on the current page
      agencyReps.slice(0, agencyRepSlots.length).forEach((item: any, index: number) => {
        const slots = agencyRepSlots[index];
        if (item.agency) drawBoundedText(targetPage, item.agency, slots.agency.x, slots.agency.y, font, slots.agency.fontSize || 8, slots.agency.maxWidth || 96);
        if (item.name)   drawBoundedText(targetPage, item.name,   slots.name.x,   slots.name.y,   font, slots.name.fontSize   || 8, slots.name.maxWidth   || 135);
      });
      // No white rectangles needed — template blank rows are already clean.

      // Handle multiple Technical Specialists (fill top-down, up to 4 on first page)
      const techSpecs = orgData.filter((item: any) => item.position === 'Technical Specialist');
      techSpecs.forEach((item: any, index: number) => {
        if (index < techSpecPositions.length && item.name) {
          const position = techSpecPositions[index];
          if (position && position.x !== undefined) {
            drawBoundedText(
              targetPage,
              item.name,
              position.x,
              position.y,
              font,
              position.fontSize || 8,
              position.maxWidth || 240
            );
          }
        }
      });

      // Handle all other single positions
      orgData.forEach((item: any) => {
        // Skip positions handled separately
        if (item.position === 'Incident Commander' ||
            item.position === 'Agency Representative' ||
            item.position === 'Technical Specialist') {
          return;
        }

        const position = positionMap[item.position];
        if (position && position.x !== undefined && item.name) {
          // Use bounded text to prevent drift into adjacent sections
          drawBoundedText(
            targetPage,
            item.name,
            position.x,
            position.y,
            font,
            position.fontSize || 8,
            position.maxWidth || 240
          );
        } else if (item.position && item.name && !position) {
          console.warn(`ICS 203: No position mapping found for "${item.position}"`);
        }
      });
    };

    // Render organization positions on first page
    renderOrganizationPositions(page);

    // Helper: draw Block 1 + Block 2 header onto any continuation page.
    const drawContPageHeader = (contPage: PDFPage) => {
      drawBoundedText(contPage, data.iapData?.incidentName || data.iapData?.name || '', ICS_203_BLOCKS.incidentName.x, ICS_203_BLOCKS.incidentName.y, font, ICS_203_BLOCKS.incidentName.fontSize || 10, ICS_203_BLOCKS.incidentName.maxWidth || 320);
      drawBoundedText(contPage, formatDate(fromDate), ICS_203_BLOCKS.opPeriodDateFrom.x, ICS_203_BLOCKS.opPeriodDateFrom.y, font, ICS_203_BLOCKS.opPeriodDateFrom.fontSize || 9, ICS_203_BLOCKS.opPeriodDateFrom.maxWidth || 80);
      drawBoundedText(contPage, formatTime(fromTime), ICS_203_BLOCKS.opPeriodTimeFrom.x, ICS_203_BLOCKS.opPeriodTimeFrom.y, font, ICS_203_BLOCKS.opPeriodTimeFrom.fontSize || 9, ICS_203_BLOCKS.opPeriodTimeFrom.maxWidth || 60);
      drawBoundedText(contPage, formatDate(toDate),   ICS_203_BLOCKS.opPeriodDateTo.x,   ICS_203_BLOCKS.opPeriodDateTo.y,   font, ICS_203_BLOCKS.opPeriodDateTo.fontSize   || 9, ICS_203_BLOCKS.opPeriodDateTo.maxWidth   || 70);
      drawBoundedText(contPage, formatTime(toTime),   ICS_203_BLOCKS.opPeriodTimeTo.x,   ICS_203_BLOCKS.opPeriodTimeTo.y,   font, ICS_203_BLOCKS.opPeriodTimeTo.fontSize   || 9, ICS_203_BLOCKS.opPeriodTimeTo.maxWidth   || 70);
    };

    // Unified Command overflow — tracks the last page created so agency rep overflow
    // can reuse it instead of adding a redundant new page.
    const icSlots = [
      ICS_203_BLOCKS.incidentCommanderName,
      ICS_203_BLOCKS.incidentCommanderName2,
      ICS_203_BLOCKS.incidentCommanderName3,
    ];
    let lastContPage: PDFPage | null = null;
    const allCommanders = orgData.filter((item: any) => item.position === 'Incident Commander');
    if (allCommanders.length > icSlots.length) {
      const overflow = allCommanders.slice(icSlots.length);
      for (let i = 0; i < overflow.length; i += icSlots.length) {
        const batch = overflow.slice(i, i + icSlots.length);
        lastContPage = await createContinuationPage(pdfDoc, TEMPLATE_URLS.ICS_203);
        drawContPageHeader(lastContPage);
        batch.forEach((cmd: any, idx: number) => {
          if (cmd.name) {
            const slot = icSlots[idx];
            drawBoundedText(lastContPage!, cmd.name, slot.x, slot.y, font, slot.fontSize || 8, slot.maxWidth || 240);
          }
        });
      }
    }

    // Agency Representative overflow — reuses the last UC continuation page for the first
    // batch so we don't add a new page when one already exists from UC overflow.
    const allAgencyReps = orgData.filter((item: any) => item.position === 'Agency Representative');
    if (allAgencyReps.length > agencyRepSlots.length) {
      const agencyOverflow = allAgencyReps.slice(agencyRepSlots.length);
      for (let i = 0; i < agencyOverflow.length; i += agencyRepSlots.length) {
        const batch = agencyOverflow.slice(i, i + agencyRepSlots.length);
        if (!(i === 0 && lastContPage !== null)) {
          lastContPage = await createContinuationPage(pdfDoc, TEMPLATE_URLS.ICS_203);
          drawContPageHeader(lastContPage);
        }
        batch.forEach((item: any, idx: number) => {
          const slots = agencyRepSlots[idx];
          if (item.agency) drawBoundedText(lastContPage!, item.agency, slots.agency.x, slots.agency.y, font, slots.agency.fontSize || 8, slots.agency.maxWidth || 96);
          if (item.name)   drawBoundedText(lastContPage!, item.name,   slots.name.x,   slots.name.y,   font, slots.name.fontSize   || 8, slots.name.maxWidth   || 135);
        });
      }
    }

    // Technical Specialist overflow — reuses the last continuation page if one exists,
    // otherwise creates a new one. Slots 0-3 (techSpecPositions) repeat on each extra page.
    const allTechSpecs = orgData.filter((item: any) => item.position === 'Technical Specialist');
    if (allTechSpecs.length > techSpecPositions.length) {
      const techSpecOverflow = allTechSpecs.slice(techSpecPositions.length);
      for (let i = 0; i < techSpecOverflow.length; i += techSpecPositions.length) {
        const batch = techSpecOverflow.slice(i, i + techSpecPositions.length);
        if (!(i === 0 && lastContPage !== null)) {
          lastContPage = await createContinuationPage(pdfDoc, TEMPLATE_URLS.ICS_203);
          drawContPageHeader(lastContPage);
        }
        batch.forEach((item: any, idx: number) => {
          const slot = techSpecPositions[idx];
          if (item.name && slot) {
            drawBoundedText(lastContPage!, item.name, slot.x, slot.y, font, slot.fontSize || 8, slot.maxWidth || 240);
          }
        });
      }
    }

    // DYNAMIC Operations Section: Branches and Divisions/Groups
    const tableConfig = ICS_203_BLOCKS.branchTableStart;
    const divisionRowHeight = tableConfig.divisionRowHeight;

    // Separate divisions by branch assignment
    const divisionsWithoutBranch: any[] = [];
    const divisionsByBranch: { [key: string]: any[] } = {};

    divisionsData.forEach((div: any) => {
      if (div.branch) {
        if (!divisionsByBranch[div.branch]) {
          divisionsByBranch[div.branch] = [];
        }
        divisionsByBranch[div.branch].push(div);
      } else {
        // No branch assigned = goes directly under Operations
        divisionsWithoutBranch.push(div);
      }
    });

    // Filter out Air Operations Branch for separate handling at bottom
    const regularBranches = branchesData.filter((b: any) =>
      b.name !== 'Air Operations Branch' && b.name !== 'Air Ops Branch'
    );
    const airOpsBranch = branchesData.find((b: any) =>
      b.name === 'Air Operations Branch' || b.name === 'Air Ops Branch'
    );

    // Helper function to render branches on a page
    const renderBranchesOnPage = (targetPage: PDFPage, branches: any[], startIndex: number) => {
      const branchSlots = tableConfig.branches;
      const branchesToRender = branches.slice(startIndex, startIndex + tableConfig.maxBranchesPerPage);

      branchesToRender.forEach((branch: any, slotIndex: number) => {
        const slot = branchSlots[slotIndex];
        if (!slot) return;

        // Branch name
        drawBoundedText(
          targetPage,
          branch.name,
          tableConfig.branchNameX,
          slot.nameY,
          font,
          tableConfig.fontSize,
          tableConfig.labelMaxWidth
        );

        // Branch director
        if (branch.directorName) {
          drawBoundedText(
            targetPage,
            branch.directorName,
            tableConfig.branchDirectorX,
            slot.directorY,
            font,
            tableConfig.fontSize,
            tableConfig.supervisorMaxWidth
          );
        }

        // Get divisions for this branch
        const branchDivisions = divisionsByBranch[branch.name] || [];
        let divisionY = slot.firstDivisionY;

        // Render divisions/groups under this branch
        branchDivisions.forEach((div: any) => {
          // Division/Group label
          let divLabel;
          if (div.position.toLowerCase().includes('division')) {
            divLabel = div.position.includes(':') ? div.position : `Division ${div.position.replace(/division\s*/i, '')}`;
          } else if (div.position.toLowerCase().includes('group')) {
            divLabel = div.position.includes(':') ? div.position : `Group ${div.position.replace(/group\s*/i, '')}`;
          } else {
            divLabel = div.position;
          }

          drawBoundedText(
            targetPage,
            divLabel,
            tableConfig.divisionLabelX,
            divisionY,
            font,
            tableConfig.fontSize,
            tableConfig.labelMaxWidth
          );

          // Supervisor name in separate column
          if (div.name) {
            drawBoundedText(
              targetPage,
              div.name,
              tableConfig.divisionSupervisorX,
              divisionY,
              font,
              tableConfig.fontSize,
              tableConfig.supervisorMaxWidth
            );
          }

          divisionY -= divisionRowHeight;
        });
      });
    };

    // Helper function to add header, organization, and footer to a page
    const addHeaderFooter = (targetPage: PDFPage) => {
      // Block 1: Incident Name
      drawBoundedText(
        targetPage,
        data.iapData?.incidentName || data.iapData?.name || '',
        ICS_203_BLOCKS.incidentName.x,
        ICS_203_BLOCKS.incidentName.y,
        font,
        ICS_203_BLOCKS.incidentName.fontSize || 10,
        ICS_203_BLOCKS.incidentName.maxWidth || 320
      );

      // Block 2: Operational Period
      const opFrom = formatDateTime(this.isoDate(data.periodData?.startAt, data.periodData?.fromDate), this.isoTime(data.periodData?.startAt, data.periodData?.fromTime));
      const opTo = formatDateTime(this.isoDate(data.periodData?.endAt, data.periodData?.toDate), this.isoTime(data.periodData?.endAt, data.periodData?.toTime));

      drawBoundedText(
        targetPage,
        opFrom,
        ICS_203_BLOCKS.opPeriodFrom.x,
        ICS_203_BLOCKS.opPeriodFrom.y,
        font,
        ICS_203_BLOCKS.opPeriodFrom.fontSize || 9,
        ICS_203_BLOCKS.opPeriodFrom.maxWidth || 180
      );

      drawBoundedText(
        targetPage,
        opTo,
        ICS_203_BLOCKS.opPeriodTo.x,
        ICS_203_BLOCKS.opPeriodTo.y,
        font,
        ICS_203_BLOCKS.opPeriodTo.fontSize || 9,
        ICS_203_BLOCKS.opPeriodTo.maxWidth || 180
      );

      // Block 3-8: Organization positions
      renderOrganizationPositions(targetPage);

      // Block 9: Prepared by
      drawBoundedText(
        targetPage,
        data.iapData?.preparedBy || '',
        ICS_203_BLOCKS.preparedByName.x,
        ICS_203_BLOCKS.preparedByName.y,
        font,
        ICS_203_BLOCKS.preparedByName.fontSize || 9,
        ICS_203_BLOCKS.preparedByName.maxWidth || 180
      );

      drawBoundedText(
        targetPage,
        data.iapData?.preparedByPosition || '',
        ICS_203_BLOCKS.preparedByPosition.x,
        ICS_203_BLOCKS.preparedByPosition.y,
        font,
        ICS_203_BLOCKS.preparedByPosition.fontSize || 9,
        ICS_203_BLOCKS.preparedByPosition.maxWidth || 140
      );

      const preparedDateTime = data.iapData?.preparedDateTime
        ? formatDateTime(
            data.iapData.preparedDateTime.split('T')[0],
            data.iapData.preparedDateTime.split('T')[1]?.substring(0, 5) || ''
          )
        : formatDateTime(
            new Date().toISOString().split('T')[0],
            new Date().toTimeString().split(' ')[0].substring(0, 5)
          );

      drawBoundedText(
        targetPage,
        preparedDateTime,
        ICS_203_BLOCKS.preparedByDateTime.x,
        ICS_203_BLOCKS.preparedByDateTime.y,
        font,
        ICS_203_BLOCKS.preparedByDateTime.fontSize || 9,
        ICS_203_BLOCKS.preparedByDateTime.maxWidth || 120
      );
    };

    // CASE 1: No branches - render divisions/groups directly under Operations
    if (regularBranches.length === 0) {
      let currentY = tableConfig.branches[0].firstDivisionY;
      divisionsWithoutBranch.forEach((div: any) => {
        // Division/Group label
        let divLabel;
        if (div.position.toLowerCase().includes('division')) {
          divLabel = div.position.includes(':') ? div.position : `Division ${div.position.replace(/division\s*/i, '')}`;
        } else if (div.position.toLowerCase().includes('group')) {
          divLabel = div.position.includes(':') ? div.position : `Group ${div.position.replace(/group\s*/i, '')}`;
        } else {
          divLabel = div.position;
        }

        drawBoundedText(
          page,
          divLabel,
          tableConfig.divisionLabelX,
          currentY,
          font,
          tableConfig.fontSize,
          tableConfig.labelMaxWidth
        );

        // Supervisor name in separate column
        if (div.name) {
          drawBoundedText(
            page,
            div.name,
            tableConfig.divisionSupervisorX,
            currentY,
            font,
            tableConfig.fontSize,
            tableConfig.supervisorMaxWidth
          );
        }

        currentY -= divisionRowHeight;
      });
    }
    // CASE 2: One or more branches
    else {
      // Render first page branches (up to 3)
      renderBranchesOnPage(page, regularBranches, 0);

      // If more than 3 branches, create continuation pages
      if (regularBranches.length > tableConfig.maxBranchesPerPage) {
        let remainingBranches = regularBranches.length - tableConfig.maxBranchesPerPage;
        let currentBranchIndex = tableConfig.maxBranchesPerPage;
        let pageNumber = 2;

        while (remainingBranches > 0) {
          // Create continuation page
          const continuationPage = await createContinuationPage(pdfDoc, TEMPLATE_URLS.ICS_203);

          // Add header and footer to continuation page
          addHeaderFooter(continuationPage);

          // Add continuation page header
          continuationPage.drawText(`Continuation Page ${pageNumber}`, {
            x: 450,
            y: 760,
            size: 10,
            font,
            color: rgb(0, 0, 0),
          });

          // Render branches on continuation page
          renderBranchesOnPage(continuationPage, regularBranches, currentBranchIndex);

          currentBranchIndex += tableConfig.maxBranchesPerPage;
          remainingBranches -= tableConfig.maxBranchesPerPage;
          pageNumber++;
        }
      }
    }

    // Air Operations Branch (special case - always at bottom per ICS 203 template on first page only)
    const airOpsBranchY = 236;
    if (airOpsBranch && airOpsBranch.directorName) {
      drawBoundedText(
        page,
        airOpsBranch.directorName,
        tableConfig.branchDirectorX,
        airOpsBranchY,
        font,
        tableConfig.fontSize,
        tableConfig.supervisorMaxWidth
      );
    }

    // Block 9: Prepared by (footer - bounded to footer lines)
    drawBoundedText(
      page,
      data.iapData?.preparedBy || '',
      ICS_203_BLOCKS.preparedByName.x,
      ICS_203_BLOCKS.preparedByName.y,
      font,
      ICS_203_BLOCKS.preparedByName.fontSize || 9,
      ICS_203_BLOCKS.preparedByName.maxWidth || 180
    );

    drawBoundedText(
      page,
      data.iapData?.preparedByPosition || '',
      ICS_203_BLOCKS.preparedByPosition.x,
      ICS_203_BLOCKS.preparedByPosition.y,
      font,
      ICS_203_BLOCKS.preparedByPosition.fontSize || 9,
      ICS_203_BLOCKS.preparedByPosition.maxWidth || 140
    );

    // Use provided datetime if available, otherwise use current time
    const preparedDateTime = data.iapData?.preparedDateTime
      ? formatDateTime(
          data.iapData.preparedDateTime.split('T')[0],
          data.iapData.preparedDateTime.split('T')[1]?.substring(0, 5) || ''
        )
      : formatDateTime(
          new Date().toISOString().split('T')[0],
          new Date().toTimeString().split(' ')[0].substring(0, 5)
        );

    drawBoundedText(
      page,
      preparedDateTime,
      ICS_203_BLOCKS.preparedByDateTime.x,
      ICS_203_BLOCKS.preparedByDateTime.y,
      font,
      ICS_203_BLOCKS.preparedByDateTime.fontSize || 9,
      ICS_203_BLOCKS.preparedByDateTime.maxWidth || 90
    );

    // Add page numbers if multiple pages
    const allPages = pdfDoc.getPages();
    if (allPages.length > 1) {
      for (let i = 0; i < allPages.length; i++) {
        drawPageNumber(allPages[i], i + 1, allPages.length, 'ICS 203');
      }
    }

    // Add OpPeriod footer to all pages
    for (const p of allPages) {
      addOpPeriodFooter(p, font);
    }

    return await pdfDoc.save();
  }

  async generateICS204(data: ICSFormData): Promise<Uint8Array> {
    const pdfDoc = await loadTemplateFirstPage(TEMPLATE_URLS.ICS_204);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.getPages()[0];

    // Block 1: Incident Name
    page.drawText(data.iapData?.incidentName || data.iapData?.name || '', {
      x: ICS_204_BLOCKS.incidentName.x,
      y: ICS_204_BLOCKS.incidentName.y,
      size: ICS_204_BLOCKS.incidentName.fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    // IAP Page number (top-right header)
    if (data.iapPageNumber !== undefined && data.iapPageNumber !== '') {
      page.drawText(String(data.iapPageNumber), {
        x: ICS_204_BLOCKS.iapPageNumber.x,
        y: ICS_204_BLOCKS.iapPageNumber.y,
        size: ICS_204_BLOCKS.iapPageNumber.fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }

    // Block 2: Operational Period
    const opFromDate = formatDate(this.isoDate(data.periodData?.startAt, data.periodData?.fromDate));
    const opFromTime = formatTime(this.isoTime(data.periodData?.startAt, data.periodData?.fromTime));
    const opToDate = formatDate(this.isoDate(data.periodData?.endAt, data.periodData?.toDate));
    const opToTime = formatTime(this.isoTime(data.periodData?.endAt, data.periodData?.toTime));

    // Draw operational period dates
    page.drawText(opFromDate, {
      x: ICS_204_BLOCKS.opPeriodDateFrom.x,
      y: ICS_204_BLOCKS.opPeriodDateFrom.y,
      size: ICS_204_BLOCKS.opPeriodDateFrom.fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(opFromTime, {
      x: ICS_204_BLOCKS.opPeriodTimeFrom.x,
      y: ICS_204_BLOCKS.opPeriodTimeFrom.y,
      size: ICS_204_BLOCKS.opPeriodTimeFrom.fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(opToDate, {
      x: ICS_204_BLOCKS.opPeriodDateTo.x,
      y: ICS_204_BLOCKS.opPeriodDateTo.y,
      size: ICS_204_BLOCKS.opPeriodDateTo.fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(opToTime, {
      x: ICS_204_BLOCKS.opPeriodTimeTo.x,
      y: ICS_204_BLOCKS.opPeriodTimeTo.y,
      size: ICS_204_BLOCKS.opPeriodTimeTo.fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    // Block 3: Branch/Division/Group
    const assignments = data.formData || [];
    if (assignments.length > 0) {
      const firstAssignment = assignments[0];
      const assignmentType = firstAssignment.divisionGroupType || 'division';

      // Use the correct field based on assignment type
      let fieldConfig;
      let personnelConfig;
      let personnelContactConfig;

      if (assignmentType === 'branch') {
        fieldConfig = ICS_204_BLOCKS.branch;
        personnelConfig = ICS_204_BLOCKS.branchDirector;
        personnelContactConfig = ICS_204_BLOCKS.branchDirectorContact;
      } else if (assignmentType === 'group') {
        fieldConfig = ICS_204_BLOCKS.group;
        personnelConfig = ICS_204_BLOCKS.divisionSupervisor;
        personnelContactConfig = ICS_204_BLOCKS.divisionSupervisorContact;
      } else if (assignmentType === 'staging') {
        fieldConfig = ICS_204_BLOCKS.stagingArea;
        personnelConfig = ICS_204_BLOCKS.divisionSupervisor;
        personnelContactConfig = ICS_204_BLOCKS.divisionSupervisorContact;
      } else {
        fieldConfig = ICS_204_BLOCKS.division;
        personnelConfig = ICS_204_BLOCKS.divisionSupervisor;
        personnelContactConfig = ICS_204_BLOCKS.divisionSupervisorContact;
      }

      // If this division/group belongs to a branch, draw the branch name
      if (firstAssignment.branch && assignmentType !== 'branch') {
        page.drawText(firstAssignment.branch, {
          x: ICS_204_BLOCKS.branch.x,
          y: ICS_204_BLOCKS.branch.y,
          size: ICS_204_BLOCKS.branch.fontSize,
          font,
          color: rgb(0, 0, 0),
          maxWidth: ICS_204_BLOCKS.branch.maxWidth,
        });
      }

      // Draw the branch/division/group name
      page.drawText(firstAssignment.division || '', {
        x: fieldConfig.x,
        y: fieldConfig.y,
        size: fieldConfig.fontSize,
        font,
        color: rgb(0, 0, 0),
        maxWidth: fieldConfig.maxWidth,
      });

      // Draw reporting location
      if (firstAssignment.reportingLocation) {
        page.drawText(firstAssignment.reportingLocation, {
          x: ICS_204_BLOCKS.reportingLocation.x,
          y: ICS_204_BLOCKS.reportingLocation.y,
          size: ICS_204_BLOCKS.reportingLocation.fontSize,
          font,
          color: rgb(0, 0, 0),
          maxWidth: ICS_204_BLOCKS.reportingLocation.maxWidth,
        });
      }

      // Block 4: Operations Personnel — Name and Contact(s) columns
      const drawOpsField = (text: string, cfg: { x: number; y: number; fontSize: number; maxWidth: number }) => {
        if (text) page.drawText(text, { x: cfg.x, y: cfg.y, size: cfg.fontSize, font, color: rgb(0, 0, 0), maxWidth: cfg.maxWidth });
      };

      // Row 1: Operations Section Chief
      drawOpsField(data.operationsSectionChief || '', ICS_204_BLOCKS.opsSectionChief);
      drawOpsField(data.operationsSectionChiefContact || '', ICS_204_BLOCKS.opsSectionChiefContact);

      // Row 2: Branch Director (only when a division/group is assigned to a branch)
      if (assignmentType !== 'branch') {
        drawOpsField(data.branchDirector || '', ICS_204_BLOCKS.branchDirector);
        drawOpsField(data.branchDirectorContact || '', ICS_204_BLOCKS.branchDirectorContact);
      }

      // Row 3: Branch Director name OR Division/Group Supervisor name + contact
      drawOpsField(firstAssignment.supervisor || '', personnelConfig);
      drawOpsField(firstAssignment.supervisorContact || '', personnelContactConfig);
    }

    // Block 5: Resources Assigned table
    let yPos = ICS_204_BLOCKS.resourcesTableStart.y;
    const cols = ICS_204_BLOCKS.resourceColumns;

    if (assignments.length > 0 && assignments[0].resources) {
      const resources = Array.isArray(assignments[0].resources) ? assignments[0].resources : [];

      resources.slice(0, 15).forEach((resource: any) => {
        drawTableCell(page, resource.name || '', cols.identifier.x, yPos, font, ICS_204_BLOCKS.resourcesTableStart.fontSize || 7, cols.identifier.maxWidth || 75);
        drawTableCell(page, resource.leaderName || '', cols.leader.x, yPos, font, ICS_204_BLOCKS.resourcesTableStart.fontSize || 7, cols.leader.maxWidth || 75);
        drawTableCell(page, resource.numPersons || '', cols.numPersons.x, yPos, font, ICS_204_BLOCKS.resourcesTableStart.fontSize || 7, cols.numPersons.maxWidth || 30);
        drawTableCell(page, resource.contact || '', cols.contact.x, yPos, font, ICS_204_BLOCKS.resourcesTableStart.fontSize || 7, cols.contact.maxWidth || 80);
        drawTableCell(page, resource.notes || '', cols.notes.x, yPos, font, ICS_204_BLOCKS.resourcesTableStart.fontSize || 7, cols.notes.maxWidth || 230);

        yPos -= ICS_204_BLOCKS.resourceRowHeight;
      });
    }

    // Block 6: Work Assignments
    if (assignments.length > 0 && assignments[0].workAssignment) {
      drawWrappedText(
        page,
        assignments[0].workAssignment,
        ICS_204_BLOCKS.workAssignmentsStart.x,
        ICS_204_BLOCKS.workAssignmentsStart.y,
        font,
        ICS_204_BLOCKS.workAssignmentsStart.fontSize || 9,
        ICS_204_BLOCKS.workAssignmentsStart.maxWidth || 520,
        12
      );
    }

    // Block 7: Special Instructions
    if (assignments.length > 0 && assignments[0].specialInstructions) {
      drawWrappedText(
        page,
        assignments[0].specialInstructions,
        ICS_204_BLOCKS.specialInstructionsStart.x,
        ICS_204_BLOCKS.specialInstructionsStart.y,
        font,
        ICS_204_BLOCKS.specialInstructionsStart.fontSize || 8,
        ICS_204_BLOCKS.specialInstructionsStart.maxWidth || 520,
        10
      );
    }

    // Block 8: Communications/Contact Info — draw each field in its own column
    if (assignments.length > 0 && assignments[0].communications) {
      const contacts = Array.isArray(assignments[0].communications) ? assignments[0].communications : [];
      const cols = ICS_204_BLOCKS.commColumns;
      const fontSize = ICS_204_BLOCKS.communicationsStart.fontSize;
      let commYPos = ICS_204_BLOCKS.communicationsStart.y;

      contacts.forEach((contact: any) => {
        if (contact.function) {
          drawTableCell(page, contact.function, cols.function.x, commYPos, font, fontSize, cols.function.maxWidth);
        }
        if (contact.name) {
          drawTableCell(page, contact.name, cols.name.x, commYPos, font, fontSize, cols.name.maxWidth);
        }
        if (contact.contact) {
          drawTableCell(page, contact.contact, cols.contact.x, commYPos, font, fontSize, cols.contact.maxWidth);
        }
        commYPos -= ICS_204_BLOCKS.commLineHeight;
      });
    }

    // Block 9: Prepared by
    page.drawText(data.preparedBy || '', {
      x: ICS_204_BLOCKS.preparedByName.x,
      y: ICS_204_BLOCKS.preparedByName.y,
      size: ICS_204_BLOCKS.preparedByName.fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(data.preparedByPosition || '', {
      x: ICS_204_BLOCKS.preparedByPosition.x,
      y: ICS_204_BLOCKS.preparedByPosition.y,
      size: ICS_204_BLOCKS.preparedByPosition.fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(data.preparedDateTime || '', {
      x: ICS_204_BLOCKS.preparedByDateTime.x,
      y: ICS_204_BLOCKS.preparedByDateTime.y,
      size: ICS_204_BLOCKS.preparedByDateTime.fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    // Add OpPeriod footer
    addOpPeriodFooter(page, font);

    // Add OpPeriod footer
    addOpPeriodFooter(page, font);

    return await pdfDoc.save();
  }

  async generateICS205(data: ICSFormData): Promise<Uint8Array> {
    const pdfDoc = await loadTemplateFirstPage(TEMPLATE_URLS.ICS_205);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.getPages()[0];

    // Don't modify rotation - work with the template as-is

    // Block 1: Incident Name
    page.drawText(sanitizeText(data.iapData?.incidentName || data.iapData?.name || ''), {
      x: ICS_205_BLOCKS.incidentName.x,
      y: ICS_205_BLOCKS.incidentName.y,
      size: ICS_205_BLOCKS.incidentName.fontSize,
      font,
      color: rgb(0, 0, 0),
      rotate: { type: 'degrees', angle: 90 },
    });

    // Block 2: Date/Time Prepared (split into two lines)
    const preparedDate = data.iapData?.preparedDateTime
      ? data.iapData.preparedDateTime.split('T')[0]
      : new Date().toISOString().split('T')[0];
    const preparedTime = data.iapData?.preparedDateTime
      ? data.iapData.preparedDateTime.split('T')[1]?.substring(0, 5) || ''
      : new Date().toTimeString().split(' ')[0].substring(0, 5);

    page.drawText(formatDate(preparedDate), {
      x: ICS_205_BLOCKS.dateTimePrepared.date.x,
      y: ICS_205_BLOCKS.dateTimePrepared.date.y,
      size: ICS_205_BLOCKS.dateTimePrepared.date.fontSize,
      font,
      color: rgb(0, 0, 0),
      rotate: { type: 'degrees', angle: 90 },
    });

    page.drawText(formatTime(preparedTime), {
      x: ICS_205_BLOCKS.dateTimePrepared.time.x,
      y: ICS_205_BLOCKS.dateTimePrepared.time.y,
      size: ICS_205_BLOCKS.dateTimePrepared.time.fontSize,
      font,
      color: rgb(0, 0, 0),
      rotate: { type: 'degrees', angle: 90 },
    });

    // Block 3: Operational Period (split into two lines each)
    const opFromDate = formatDate(this.isoDate(data.periodData?.startAt, data.periodData?.fromDate));
    const opFromTime = formatTime(this.isoTime(data.periodData?.startAt, data.periodData?.fromTime));
    const opToDate = formatDate(this.isoDate(data.periodData?.endAt, data.periodData?.toDate));
    const opToTime = formatTime(this.isoTime(data.periodData?.endAt, data.periodData?.toTime));

    page.drawText(opFromDate, {
      x: ICS_205_BLOCKS.opPeriodFrom.date.x,
      y: ICS_205_BLOCKS.opPeriodFrom.date.y,
      size: 7,
      font,
      color: rgb(0, 0, 0),
      rotate: { type: 'degrees', angle: 90 },
    });

    page.drawText(opFromTime, {
      x: ICS_205_BLOCKS.opPeriodFrom.time.x,
      y: ICS_205_BLOCKS.opPeriodFrom.time.y,
      size: 7,
      font,
      color: rgb(0, 0, 0),
      rotate: { type: 'degrees', angle: 90 },
    });

    page.drawText(opToDate, {
      x: ICS_205_BLOCKS.opPeriodTo.date.x,
      y: ICS_205_BLOCKS.opPeriodTo.date.y,
      size: 7,
      font,
      color: rgb(0, 0, 0),
      rotate: { type: 'degrees', angle: 90 },
    });

    page.drawText(opToTime, {
      x: ICS_205_BLOCKS.opPeriodTo.time.x,
      y: ICS_205_BLOCKS.opPeriodTo.time.y,
      size: 7,
      font,
      color: rgb(0, 0, 0),
      rotate: { type: 'degrees', angle: 90 },
    });

    // Prepare preparedBy date/time variables for use in main page and continuation pages
    const preparedByDate = data.iapData?.preparedDateTime
      ? data.iapData.preparedDateTime.split('T')[0]
      : new Date().toISOString().split('T')[0];
    const preparedByTime = data.iapData?.preparedDateTime
      ? data.iapData.preparedDateTime.split('T')[1]?.substring(0, 5) || ''
      : new Date().toTimeString().split(' ')[0].substring(0, 5);

    // Block 4: Radio Communications Table
    const comms = data.formData || [];
    const tableStart = ICS_205_BLOCKS.radioTableStart;
    const rowHeight = ICS_205_BLOCKS.radioRowHeight;
    const maxChannelsPerPage = 8;

    // Helper function to render channels on a page
    const renderChannelsOnPage = (targetPage: PDFPage, startIndex: number) => {
      const channelsToRender = comms.slice(startIndex, startIndex + maxChannelsPerPage);

      channelsToRender.forEach((item: any, index: number) => {
        const cols = ICS_205_BLOCKS.radioColumns;
        const xPos = tableStart.x + (index * rowHeight);

        drawTableCell(targetPage, item.zoneGroup || item.zone || '', xPos, cols.zoneGroup.y, font, tableStart.fontSize || 7, cols.zoneGroup.maxWidth || 40, 90);
        drawTableCell(targetPage, item.channelNumber || '', xPos, cols.channelNumber.y, font, tableStart.fontSize || 7, cols.channelNumber.maxWidth || 30, 90);
        drawTableCell(targetPage, item.function || '', xPos, cols.function.y, font, tableStart.fontSize || 7, cols.function.maxWidth || 60, 90);
        drawTableCell(targetPage, item.channelName || '', xPos, cols.channelName.y, font, tableStart.fontSize || 7, cols.channelName.maxWidth || 80, 90);
        drawTableCell(targetPage, item.assignment || '', xPos, cols.assignment.y, font, tableStart.fontSize || 7, cols.assignment.maxWidth || 70, 90);
        drawTableCell(targetPage, item.rxFreq || '', xPos, cols.rxFreq.y, font, tableStart.fontSize || 7, cols.rxFreq.maxWidth || 50, 90);
        drawTableCell(targetPage, item.rxTone || '', xPos, cols.rxTone.y, font, tableStart.fontSize || 7, cols.rxTone.maxWidth || 40, 90);
        drawTableCell(targetPage, item.txFreq || '', xPos, cols.txFreq.y, font, tableStart.fontSize || 7, cols.txFreq.maxWidth || 50, 90);
        drawTableCell(targetPage, item.txTone || '', xPos, cols.txTone.y, font, tableStart.fontSize || 7, cols.txTone.maxWidth || 40, 90);
        drawTableCell(targetPage, item.mode || '', xPos, cols.mode.y, font, tableStart.fontSize || 7, cols.mode.maxWidth || 30, 90);
        drawTableCell(targetPage, item.remarks || '', xPos, cols.remarks.y, font, tableStart.fontSize || 7, cols.remarks.maxWidth || 150, 90);
      });
    };

    // Render first page channels
    renderChannelsOnPage(page, 0);

    // Create continuation pages if needed
    if (comms.length > maxChannelsPerPage) {
      let remainingChannels = comms.length - maxChannelsPerPage;
      let currentChannelIndex = maxChannelsPerPage;
      let pageNumber = 2;

      while (remainingChannels > 0) {
        const continuationPage = await createContinuationPage(pdfDoc, TEMPLATE_URLS.ICS_205);

        // Add continuation page header
        continuationPage.drawText(`Continuation Page ${pageNumber}`, {
          x: 30,
          y: 740,
          size: 10,
          font,
          color: rgb(0, 0, 0),
          rotate: { type: 'degrees', angle: 90 },
        });

        // Block 1: Incident Name
        continuationPage.drawText(sanitizeText(data.iapData?.incidentName || data.iapData?.name || ''), {
          x: ICS_205_BLOCKS.incidentName.x,
          y: ICS_205_BLOCKS.incidentName.y,
          size: ICS_205_BLOCKS.incidentName.fontSize,
          font,
          color: rgb(0, 0, 0),
          rotate: { type: 'degrees', angle: 90 },
        });

        // Block 2: Date/Time Prepared
        continuationPage.drawText(formatDate(preparedDate), {
          x: ICS_205_BLOCKS.dateTimePrepared.date.x,
          y: ICS_205_BLOCKS.dateTimePrepared.date.y,
          size: ICS_205_BLOCKS.dateTimePrepared.date.fontSize,
          font,
          color: rgb(0, 0, 0),
          rotate: { type: 'degrees', angle: 90 },
        });

        continuationPage.drawText(formatTime(preparedTime), {
          x: ICS_205_BLOCKS.dateTimePrepared.time.x,
          y: ICS_205_BLOCKS.dateTimePrepared.time.y,
          size: ICS_205_BLOCKS.dateTimePrepared.time.fontSize,
          font,
          color: rgb(0, 0, 0),
          rotate: { type: 'degrees', angle: 90 },
        });

        // Block 3: Operational Period
        continuationPage.drawText(opFromDate, {
          x: ICS_205_BLOCKS.opPeriodFrom.date.x,
          y: ICS_205_BLOCKS.opPeriodFrom.date.y,
          size: 7,
          font,
          color: rgb(0, 0, 0),
          rotate: { type: 'degrees', angle: 90 },
        });

        continuationPage.drawText(opFromTime, {
          x: ICS_205_BLOCKS.opPeriodFrom.time.x,
          y: ICS_205_BLOCKS.opPeriodFrom.time.y,
          size: 7,
          font,
          color: rgb(0, 0, 0),
          rotate: { type: 'degrees', angle: 90 },
        });

        continuationPage.drawText(opToDate, {
          x: ICS_205_BLOCKS.opPeriodTo.date.x,
          y: ICS_205_BLOCKS.opPeriodTo.date.y,
          size: 7,
          font,
          color: rgb(0, 0, 0),
          rotate: { type: 'degrees', angle: 90 },
        });

        continuationPage.drawText(opToTime, {
          x: ICS_205_BLOCKS.opPeriodTo.time.x,
          y: ICS_205_BLOCKS.opPeriodTo.time.y,
          size: 7,
          font,
          color: rgb(0, 0, 0),
          rotate: { type: 'degrees', angle: 90 },
        });

        // Block 6: Prepared by
        continuationPage.drawText(data.iapData?.preparedBy || '', {
          x: ICS_205_BLOCKS.preparedByName.x,
          y: ICS_205_BLOCKS.preparedByName.y,
          size: ICS_205_BLOCKS.preparedByName.fontSize,
          font,
          color: rgb(0, 0, 0),
          rotate: { type: 'degrees', angle: 90 },
        });

        continuationPage.drawText(preparedByDate, {
          x: ICS_205_BLOCKS.preparedByDateTime.date.x,
          y: ICS_205_BLOCKS.preparedByDateTime.date.y,
          size: ICS_205_BLOCKS.preparedByDateTime.date.fontSize,
          font,
          color: rgb(0, 0, 0),
          rotate: { type: 'degrees', angle: 90 },
        });

        continuationPage.drawText(preparedByTime, {
          x: ICS_205_BLOCKS.preparedByDateTime.time.x,
          y: ICS_205_BLOCKS.preparedByDateTime.time.y,
          size: ICS_205_BLOCKS.preparedByDateTime.time.fontSize,
          font,
          color: rgb(0, 0, 0),
          rotate: { type: 'degrees', angle: 90 },
        });

        // Render channels on continuation page
        renderChannelsOnPage(continuationPage, currentChannelIndex);

        currentChannelIndex += maxChannelsPerPage;
        remainingChannels -= maxChannelsPerPage;
        pageNumber++;
      }
    }

    // Block 5: Special Instructions
    if (data.specialInstructions) {
      drawTableCell(
        page,
        data.specialInstructions,
        ICS_205_BLOCKS.specialInstructionsStart.x,
        ICS_205_BLOCKS.specialInstructionsStart.y,
        font,
        ICS_205_BLOCKS.specialInstructionsStart.fontSize,
        ICS_205_BLOCKS.specialInstructionsStart.maxWidth,
        90
      );
    }

    // Block 6: Prepared by
    page.drawText(data.iapData?.preparedBy || '', {
      x: ICS_205_BLOCKS.preparedByName.x,
      y: ICS_205_BLOCKS.preparedByName.y,
      size: ICS_205_BLOCKS.preparedByName.fontSize,
      font,
      color: rgb(0, 0, 0),
      rotate: { type: 'degrees', angle: 90 },
    });

    page.drawText(preparedByDate, {
      x: ICS_205_BLOCKS.preparedByDateTime.date.x,
      y: ICS_205_BLOCKS.preparedByDateTime.date.y,
      size: ICS_205_BLOCKS.preparedByDateTime.date.fontSize,
      font,
      color: rgb(0, 0, 0),
      rotate: { type: 'degrees', angle: 90 },
    });

    page.drawText(preparedByTime, {
      x: ICS_205_BLOCKS.preparedByDateTime.time.x,
      y: ICS_205_BLOCKS.preparedByDateTime.time.y,
      size: ICS_205_BLOCKS.preparedByDateTime.time.fontSize,
      font,
      color: rgb(0, 0, 0),
      rotate: { type: 'degrees', angle: 90 },
    });

    // Add OpPeriod footer
    addOpPeriodFooter(page, font);

    return await pdfDoc.save();
  }

  async generateICS205A(data: ICSFormData): Promise<Uint8Array> {
    const pdfDoc = await loadTemplateFirstPage(TEMPLATE_URLS.ICS_205A);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.getPages()[0];

    // Block 1: Incident Name
    page.drawText(data.iapData?.incidentName || data.iapData?.name || '', {
      x: ICS_205A_BLOCKS.incidentName.x,
      y: ICS_205A_BLOCKS.incidentName.y,
      size: ICS_205A_BLOCKS.incidentName.fontSize,
      font,
      color: rgb(0, 0, 0),
      maxWidth: ICS_205A_BLOCKS.incidentName.maxWidth,
    });

    // Block 2: Operational Period — separate date and time rows
    const fromDate = this.isoDate(data.periodData?.startAt, data.periodData?.fromDate);
    const fromTime = this.isoTime(data.periodData?.startAt, data.periodData?.fromTime);
    const toDate   = this.isoDate(data.periodData?.endAt,   data.periodData?.toDate);
    const toTime   = this.isoTime(data.periodData?.endAt,   data.periodData?.toTime);

    const draw205A = (text: string, cfg: { x: number; y: number; fontSize: number; maxWidth?: number }) => {
      if (text) page.drawText(text, { x: cfg.x, y: cfg.y, size: cfg.fontSize, font, color: rgb(0, 0, 0), maxWidth: cfg.maxWidth });
    };
    draw205A(formatDate(fromDate), ICS_205A_BLOCKS.opPeriodDateFrom);
    draw205A(formatTime(fromTime), ICS_205A_BLOCKS.opPeriodTimeFrom);
    draw205A(formatDate(toDate),   ICS_205A_BLOCKS.opPeriodDateTo);
    draw205A(formatTime(toTime),   ICS_205A_BLOCKS.opPeriodTimeTo);

    // Block 3: Communications Table
    const comms = data.formData || [];
    let yPos = ICS_205A_BLOCKS.commTableStart.y;

    comms.slice(0, 20).forEach((item: any) => {
      const cols = ICS_205A_BLOCKS.commColumns;

      drawTableCell(page, item.role || item.position || '', cols.position.x, yPos, font, ICS_205A_BLOCKS.commTableStart.fontSize || 8, cols.position.maxWidth || 150);
      drawTableCell(page, item.name || '', cols.name.x, yPos, font, ICS_205A_BLOCKS.commTableStart.fontSize || 8, cols.name.maxWidth || 150);
      // Combine phone and radio into method/contact column
      const contactMethod = [item.phone, item.radio].filter(Boolean).join(' / ');
      drawTableCell(page, contactMethod, cols.method.x, yPos, font, ICS_205A_BLOCKS.commTableStart.fontSize || 8, cols.method.maxWidth || 200);

      yPos -= ICS_205A_BLOCKS.commRowHeight;
    });

    // Block 4: Prepared by
    page.drawText(data.iapData?.preparedBy || '', {
      x: ICS_205A_BLOCKS.preparedByName.x,
      y: ICS_205A_BLOCKS.preparedByName.y,
      size: ICS_205A_BLOCKS.preparedByName.fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(data.iapData?.preparedByPosition || '', {
      x: ICS_205A_BLOCKS.preparedByPosition.x,
      y: ICS_205A_BLOCKS.preparedByPosition.y,
      size: ICS_205A_BLOCKS.preparedByPosition.fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    const prepDT = data.iapData?.preparedDateTime
      ? formatDateTime(data.iapData.preparedDateTime.split('T')[0], data.iapData.preparedDateTime.split('T')[1]?.substring(0, 5) || '')
      : '';
    if (prepDT) {
      page.drawText(prepDT, {
        x: ICS_205A_BLOCKS.preparedByDateTime.x,
        y: ICS_205A_BLOCKS.preparedByDateTime.y,
        size: ICS_205A_BLOCKS.preparedByDateTime.fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }

    // Add OpPeriod footer
    addOpPeriodFooter(page, font);

    return await pdfDoc.save();
  }

  async generateICS206(data: ICSFormData): Promise<Uint8Array> {
    const pdfDoc = await loadTemplateFirstPage(TEMPLATE_URLS.ICS_206);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const opFromDate = this.isoDate(data.periodData?.startAt, data.periodData?.fromDate);
    const opFromTime = this.isoTime(data.periodData?.startAt, data.periodData?.fromTime);
    const opToDate   = this.isoDate(data.periodData?.endAt,   data.periodData?.toDate);
    const opToTime   = this.isoTime(data.periodData?.endAt,   data.periodData?.toTime);

    const medical             = data.formData || [];
    // Only render entries that have at least one meaningful field — blank saved rows are skipped
    const medicalStations     = medical.filter((item: any) => item.itemType === 'medicalStation'  && (item.name     || item.location || item.contact));
    const transportationItems = medical.filter((item: any) => item.itemType === 'transportation'  && (item.ambulanceService || item.service || item.location || item.contact));
    const hospitalItems       = medical.filter((item: any) => item.itemType === 'hospital'        && (item.hospitalName || item.name || item.address || item.contact));
    const proceduresItem      = medical.find((item: any)  => item.itemType === 'procedures');

    // Pre-printed data rows per section on the ICS 206 template (adjust if template changes)
    const MAX_STATIONS  = 6;
    const MAX_TRANSPORT = 4;
    const MAX_HOSPITALS = 5;

    const totalPages = Math.max(
      Math.ceil(medicalStations.length     / MAX_STATIONS)  || 1,
      Math.ceil(transportationItems.length / MAX_TRANSPORT) || 1,
      Math.ceil(hospitalItems.length       / MAX_HOSPITALS) || 1,
      1,
    );

    // Draw Block 1 + Block 2 header onto any page
    const drawHeader = (page: PDFPage) => {
      page.drawText(data.iapData?.incidentName || data.iapData?.name || '', {
        x: ICS_206_BLOCKS.incidentName.x, y: ICS_206_BLOCKS.incidentName.y,
        size: ICS_206_BLOCKS.incidentName.fontSize, font, color: rgb(0, 0, 0),
      });
      page.drawText(opFromDate, { x: ICS_206_BLOCKS.opPeriodFrom.date.x, y: ICS_206_BLOCKS.opPeriodFrom.date.y, size: ICS_206_BLOCKS.opPeriodFrom.date.fontSize, font, color: rgb(0, 0, 0) });
      page.drawText(opFromTime, { x: ICS_206_BLOCKS.opPeriodFrom.time.x, y: ICS_206_BLOCKS.opPeriodFrom.time.y, size: ICS_206_BLOCKS.opPeriodFrom.time.fontSize, font, color: rgb(0, 0, 0) });
      page.drawText(opToDate,   { x: ICS_206_BLOCKS.opPeriodTo.date.x,   y: ICS_206_BLOCKS.opPeriodTo.date.y,   size: ICS_206_BLOCKS.opPeriodTo.date.fontSize,   font, color: rgb(0, 0, 0) });
      page.drawText(opToTime,   { x: ICS_206_BLOCKS.opPeriodTo.time.x,   y: ICS_206_BLOCKS.opPeriodTo.time.y,   size: ICS_206_BLOCKS.opPeriodTo.time.fontSize,   font, color: rgb(0, 0, 0) });
    };

    // Draw a slice of medical aid stations at the section's fixed y start
    const drawAidStations = (page: PDFPage, slice: any[]) => {
      const cols = ICS_206_BLOCKS.aidStationColumns;
      let yPos = ICS_206_BLOCKS.aidStationsStart.y;
      slice.forEach((item: any) => {
        drawTableCell(page, item.name     || '', cols.name.x,     yPos, font, ICS_206_BLOCKS.aidStationsStart.fontSize || 7, cols.name.maxWidth     || 150);
        drawTableCell(page, item.location || '', cols.location.x, yPos, font, ICS_206_BLOCKS.aidStationsStart.fontSize || 7, cols.location.maxWidth || 200);
        drawTableCell(page, item.contact  || '', cols.contact.x,  yPos, font, ICS_206_BLOCKS.aidStationsStart.fontSize || 7, cols.contact.maxWidth  || 150);
        if (cols.paramedicsYes && cols.paramedicsNo) {
          const isYes = item.paramedic === 'Yes' || item.paramedic === true;
          const isNo  = item.paramedic === 'No'  || item.paramedic === false;
          drawCheckbox(page, cols.paramedicsYes.x, yPos + 3, 10, isYes, false);
          drawCheckbox(page, cols.paramedicsNo.x,  yPos + 3, 10, isNo,  false);
        }
        yPos -= ICS_206_BLOCKS.aidStationRowHeight;
      });
    };

    // Draw a slice of transportation entries
    const drawTransportation = (page: PDFPage, slice: any[]) => {
      const cols = ICS_206_BLOCKS.transportationColumns;
      let yPos = ICS_206_BLOCKS.transportationStart.y;
      slice.forEach((item: any) => {
        drawTableCell(page, item.service  || '', cols.service.x,  yPos, font, ICS_206_BLOCKS.transportationStart.fontSize || 7, cols.service.maxWidth  || 140);
        drawTableCell(page, item.location || '', cols.location.x, yPos, font, ICS_206_BLOCKS.transportationStart.fontSize || 7, cols.location.maxWidth || 140);
        drawTableCell(page, item.contact  || '', cols.contact.x,  yPos, font, ICS_206_BLOCKS.transportationStart.fontSize || 7, cols.contact.maxWidth  || 120);
        if (cols.levelALS && cols.levelBLS) {
          drawCheckbox(page, cols.levelALS.x, yPos + 3, 10, item.level === 'ALS', false);
          drawCheckbox(page, cols.levelBLS.x, yPos + 3, 10, item.level === 'BLS', false);
        }
        yPos -= ICS_206_BLOCKS.transportationRowHeight;
      });
    };

    // Draw a slice of hospital entries
    const drawHospitals = (page: PDFPage, slice: any[]) => {
      const cols = ICS_206_BLOCKS.hospitalColumns;
      let yPos = ICS_206_BLOCKS.hospitalsStart.y;
      slice.forEach((item: any) => {
        drawWrappedText(page, item.name       || '', cols.name.x,       yPos, font, ICS_206_BLOCKS.hospitalsStart.fontSize || 6, cols.name.maxWidth       || 110, 8);
        drawWrappedText(page, item.address    || '', cols.address.x,    yPos, font, ICS_206_BLOCKS.hospitalsStart.fontSize || 6, cols.address.maxWidth    || 130, 8);
        drawWrappedText(page, item.contact    || '', cols.contact.x,    yPos, font, ICS_206_BLOCKS.hospitalsStart.fontSize || 6, cols.contact.maxWidth    ||  95, 8);
        drawTableCell(page, item.airTime      || '', cols.airTime.x,    yPos, font, ICS_206_BLOCKS.hospitalsStart.fontSize || 6, cols.airTime.maxWidth    ||  32);
        drawTableCell(page, item.groundTime   || '', cols.groundTime.x, yPos, font, ICS_206_BLOCKS.hospitalsStart.fontSize || 6, cols.groundTime.maxWidth ||  32);
        if (cols.traumaCenterYes) {
          drawCheckbox(page, cols.traumaCenterYes.x, yPos + (cols.traumaCenterYes.yOffset || 0), 8, item.traumaCenter === true, false);
          if (item.traumaCenter && item.traumaCenterLevel && cols.traumaCenterLevel) {
            drawTableCell(page, item.traumaCenterLevel, cols.traumaCenterLevel.x, yPos + (cols.traumaCenterLevel.yOffset || 0), font, 12, cols.traumaCenterLevel.maxWidth || 20);
          }
        }
        if (cols.burnCenterYes && cols.burnCenterNo) {
          drawCheckbox(page, cols.burnCenterYes.x, yPos + (cols.burnCenterYes.yOffset || 0), 8, item.burnCenter === true,  false);
          drawCheckbox(page, cols.burnCenterNo.x,  yPos + (cols.burnCenterNo.yOffset  || 0), 8, item.burnCenter === false, false);
        }
        if (cols.helipadYes && cols.helipadNo) {
          drawCheckbox(page, cols.helipadYes.x, yPos + (cols.helipadYes.yOffset || 0), 8, item.helipad === true,  false);
          drawCheckbox(page, cols.helipadNo.x,  yPos + (cols.helipadNo.yOffset  || 0), 8, item.helipad === false, false);
        }
        yPos -= ICS_206_BLOCKS.hospitalRowHeight;
      });
    };

    // Render all pages — each is a full ICS 206 template with its slice of each section
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const page = pageIndex === 0
        ? pdfDoc.getPages()[0]
        : await createContinuationPage(pdfDoc, TEMPLATE_URLS.ICS_206);

      drawHeader(page);
      drawAidStations(page,    medicalStations.slice(    pageIndex * MAX_STATIONS,  (pageIndex + 1) * MAX_STATIONS));
      drawTransportation(page, transportationItems.slice(pageIndex * MAX_TRANSPORT, (pageIndex + 1) * MAX_TRANSPORT));
      drawHospitals(page,      hospitalItems.slice(      pageIndex * MAX_HOSPITALS, (pageIndex + 1) * MAX_HOSPITALS));

      // Special procedures and footer only on the last page
      if (pageIndex === totalPages - 1) {
        if (proceduresItem?.content) {
          drawWrappedText(page, proceduresItem.content, ICS_206_BLOCKS.specialProceduresStart.x, ICS_206_BLOCKS.specialProceduresStart.y, font, ICS_206_BLOCKS.specialProceduresStart.fontSize || 8, ICS_206_BLOCKS.specialProceduresStart.maxWidth || 690, 12);
        }
        page.drawText(data.iapData?.preparedBy || '', {
          x: ICS_206_BLOCKS.preparedByName.x, y: ICS_206_BLOCKS.preparedByName.y,
          size: ICS_206_BLOCKS.preparedByName.fontSize, font, color: rgb(0, 0, 0),
        });
        const icName = data.organizationData?.find((item: any) => item.position === 'Incident Commander')?.name || '';
        if (icName) {
          page.drawText(icName, {
            x: ICS_206_BLOCKS.approvedByName.x, y: ICS_206_BLOCKS.approvedByName.y,
            size: ICS_206_BLOCKS.approvedByName.fontSize || 9, font, color: rgb(0, 0, 0),
            maxWidth: ICS_206_BLOCKS.approvedByName.maxWidth,
          });
        }
      }

      addOpPeriodFooter(page, font);
    }

    // Page numbers when more than one page
    const allPages = pdfDoc.getPages();
    if (allPages.length > 1) {
      allPages.forEach((p, i) => drawPageNumber(p, i + 1, allPages.length, 'ICS 206'));
    }

    return await pdfDoc.save();
  }

  async generateICS207(data: ICSFormData): Promise<Uint8Array> {
    const pdfDoc = await loadTemplateFirstPage(TEMPLATE_URLS.ICS_207);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.getPages()[0];

    // ICS 207 is stored as a portrait PDF but with landscape content rotated 90° CCW.
    // All filled-in text must be drawn with rotate=90 (CCW) so it reads left-to-right
    // when the form is viewed in landscape (user rotates page 90° CCW).
    const ics207Rotate = { type: 'degrees' as const, angle: 90 };

    // Block 1: Incident Name
    page.drawText(sanitizeText(data.iapData?.incidentName || data.iapData?.name || ''), {
      x: ICS_207_BLOCKS.incidentName.x,
      y: ICS_207_BLOCKS.incidentName.y,
      size: ICS_207_BLOCKS.incidentName.fontSize,
      font,
      color: rgb(0, 0, 0),
      rotate: ics207Rotate,
    });

    // Block 2: Operational Period — separate Date and Time rows
    const opFromDate = formatDate(this.isoDate(data.periodData?.startAt, data.periodData?.fromDate));
    const opFromTime = formatTime(this.isoTime(data.periodData?.startAt, data.periodData?.fromTime));
    const opToDate   = formatDate(this.isoDate(data.periodData?.endAt,   data.periodData?.toDate));
    const opToTime   = formatTime(this.isoTime(data.periodData?.endAt,   data.periodData?.toTime));

    page.drawText(opFromDate, { x: ICS_207_BLOCKS.opPeriodFrom.date.x, y: ICS_207_BLOCKS.opPeriodFrom.date.y, size: ICS_207_BLOCKS.opPeriodFrom.date.fontSize, font, color: rgb(0, 0, 0), rotate: ics207Rotate });
    page.drawText(opFromTime, { x: ICS_207_BLOCKS.opPeriodFrom.time.x, y: ICS_207_BLOCKS.opPeriodFrom.time.y, size: ICS_207_BLOCKS.opPeriodFrom.time.fontSize, font, color: rgb(0, 0, 0), rotate: ics207Rotate });
    page.drawText(opToDate,   { x: ICS_207_BLOCKS.opPeriodTo.date.x,   y: ICS_207_BLOCKS.opPeriodTo.date.y,   size: ICS_207_BLOCKS.opPeriodTo.date.fontSize,   font, color: rgb(0, 0, 0), rotate: ics207Rotate });
    page.drawText(opToTime,   { x: ICS_207_BLOCKS.opPeriodTo.time.x,   y: ICS_207_BLOCKS.opPeriodTo.time.y,   size: ICS_207_BLOCKS.opPeriodTo.time.fontSize,   font, color: rgb(0, 0, 0), rotate: ics207Rotate });

    // Block 3: Organization Chart — names drawn in lower portion of each pre-printed box
    const orgData = data.formData || [];
    const chartPositions = ICS_207_BLOCKS.orgChart;

    const positionMap: { [key: string]: any } = {
      'Incident Commander':          chartPositions.incidentCommander,
      'Safety Officer':              chartPositions.safetyOfficer,
      'Public Information Officer':  chartPositions.publicInfoOfficer,
      'Liaison Officer':             chartPositions.liaisonOfficer,
      'Operations Section Chief':    chartPositions.operationsChief,
      'Planning Section Chief':      chartPositions.planningChief,
      'Logistics Section Chief':     chartPositions.logisticsChief,
      'Finance/Admin Section Chief': chartPositions.financeChief,
    };

    orgData.forEach((item: any) => {
      const pos = positionMap[item.position];
      if (pos && item.name) {
        drawBoundedText(page, sanitizeText(item.name), pos.x, pos.y, font, pos.fontSize || 8, pos.maxWidth || 110);
      }
    });

    // Block 4: Prepared by (portrait right strip — same rotation as all other ICS 207 text)
    page.drawText(sanitizeText(data.iapData?.preparedBy || ''), {
      x: ICS_207_BLOCKS.preparedByName.x,
      y: ICS_207_BLOCKS.preparedByName.y,
      size: ICS_207_BLOCKS.preparedByName.fontSize,
      font,
      color: rgb(0, 0, 0),
      rotate: ics207Rotate,
    });

    page.drawText(sanitizeText(data.iapData?.preparedByPosition || ''), {
      x: ICS_207_BLOCKS.preparedByPosition.x,
      y: ICS_207_BLOCKS.preparedByPosition.y,
      size: ICS_207_BLOCKS.preparedByPosition.fontSize,
      font,
      color: rgb(0, 0, 0),
      rotate: ics207Rotate,
    });

    const preparedDateTime = data.iapData?.preparedDateTime
      ? formatDateTime(data.iapData.preparedDateTime.split('T')[0], data.iapData.preparedDateTime.split('T')[1]?.substring(0, 5) || '')
      : formatDateTime(new Date().toISOString().split('T')[0], new Date().toTimeString().split(' ')[0].substring(0, 5));
    page.drawText(sanitizeText(preparedDateTime), {
      x: ICS_207_BLOCKS.preparedByDateTime.x,
      y: ICS_207_BLOCKS.preparedByDateTime.y,
      size: ICS_207_BLOCKS.preparedByDateTime.fontSize,
      font,
      color: rgb(0, 0, 0),
      rotate: ics207Rotate,
    });

    addOpPeriodFooter(page, font);

    return await pdfDoc.save();
  }

  async generateICS208(data: ICSFormData): Promise<Uint8Array> {
    const pdfDoc = await loadTemplateFirstPage(TEMPLATE_URLS.ICS_208);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Pre-compute header values shared across all pages
    const incidentName = sanitizeText(data.iapData?.incidentName || data.iapData?.name || '');
    const opFromDate = sanitizeText(this.isoDate(data.periodData?.startAt, data.periodData?.fromDate));
    const opFromTime = sanitizeText(this.isoTime(data.periodData?.startAt, data.periodData?.fromTime));
    const opToDate   = sanitizeText(this.isoDate(data.periodData?.endAt, data.periodData?.toDate));
    const opToTime   = sanitizeText(this.isoTime(data.periodData?.endAt, data.periodData?.toTime));

    const drawHeader = (page: PDFPage) => {
      page.drawText(incidentName, { x: ICS_208_BLOCKS.incidentName.x, y: ICS_208_BLOCKS.incidentName.y, size: ICS_208_BLOCKS.incidentName.fontSize, font, color: rgb(0, 0, 0) });
      page.drawText(opFromDate,   { x: ICS_208_BLOCKS.opPeriodFrom.date.x, y: ICS_208_BLOCKS.opPeriodFrom.date.y, size: ICS_208_BLOCKS.opPeriodFrom.date.fontSize, font, color: rgb(0, 0, 0) });
      page.drawText(opFromTime,   { x: ICS_208_BLOCKS.opPeriodFrom.time.x, y: ICS_208_BLOCKS.opPeriodFrom.time.y, size: ICS_208_BLOCKS.opPeriodFrom.time.fontSize, font, color: rgb(0, 0, 0) });
      page.drawText(opToDate,     { x: ICS_208_BLOCKS.opPeriodTo.date.x,   y: ICS_208_BLOCKS.opPeriodTo.date.y,   size: ICS_208_BLOCKS.opPeriodTo.date.fontSize,   font, color: rgb(0, 0, 0) });
      page.drawText(opToTime,     { x: ICS_208_BLOCKS.opPeriodTo.time.x,   y: ICS_208_BLOCKS.opPeriodTo.time.y,   size: ICS_208_BLOCKS.opPeriodTo.time.fontSize,   font, color: rgb(0, 0, 0) });
    };

    const safety = data.formData || [];
    const safetyMessageItem  = safety.find((item: any) => item.itemType === 'message');
    const siteSafetyPlanItem = safety.find((item: any) => item.itemType === 'siteSafetyPlan');

    // --- Safety message layout constants ---
    const fontSize       = ICS_208_BLOCKS.safetyMessageStart.fontSize || 9;
    const maxWidth       = ICS_208_BLOCKS.safetyMessageStart.maxWidth || 510;
    const lineHeight     = ICS_208_BLOCKS.safetyLineHeight;
    const startX         = ICS_208_BLOCKS.safetyMessageStart.x;
    const contentStartY  = ICS_208_BLOCKS.safetyMessageStart.y;  // 670
    const contentBottomY = 130;
    const linesPerPage   = Math.floor((contentStartY - contentBottomY) / lineHeight);
    const msgLines       = safetyMessageItem?.content
      ? wrapText(safetyMessageItem.content, font, fontSize, maxWidth) : [];

    // --- Location field ---
    const locFontSize = ICS_208_BLOCKS.siteSafetyPlanLocation.fontSize || 9;
    const locMaxWidth = ICS_208_BLOCKS.siteSafetyPlanLocation.maxWidth || 450;
    const locLineH    = 11;
    const locStartY   = ICS_208_BLOCKS.siteSafetyPlanLocation.y;

    const locationText = siteSafetyPlanItem?.required && siteSafetyPlanItem?.location
      ? sanitizeText(siteSafetyPlanItem.location) : '';

    // Split location text: first line goes in the footer on the safety-message page,
    // any remaining lines go to a dedicated continuation page.
    const locAllLines   = locationText ? wrapText(locationText, font, locFontSize, locMaxWidth) : [];
    const locLine1      = locAllLines[0] || '';   // shown in footer at y=99 (1 line max)
    const locRestLines  = locAllLines.slice(1);   // continuation page content

    // --- Distribute safety message lines across pages ---
    const msgPages: string[][] = [];
    const remainingMsg = [...msgLines];
    do { msgPages.push(remainingMsg.splice(0, linesPerPage)); } while (remainingMsg.length > 0);
    if (msgPages.length === 0) msgPages.push([]);

    const needsExtraPage = locRestLines.length > 0;
    const totalPages     = msgPages.length + (needsExtraPage ? 1 : 0);

    // Helper: draw footer (checkbox + first location line + prepared by)
    const drawFooter = (page: PDFPage) => {
      if (siteSafetyPlanItem) {
        const yesX   = ICS_208_BLOCKS.siteSafetyPlanRequired.x;
        const checkY = ICS_208_BLOCKS.siteSafetyPlanRequired.y;
        drawCheckbox(page, yesX,      checkY, 8, siteSafetyPlanItem.required === true);
        drawCheckbox(page, yesX + 30, checkY, 8, siteSafetyPlanItem.required === false);
        if (locLine1) {
          page.drawText(locLine1, {
            x: ICS_208_BLOCKS.siteSafetyPlanLocation.x, y: locStartY,
            size: locFontSize, font, color: rgb(0, 0, 0),
            maxWidth: locMaxWidth,
          });
        }
      }
      page.drawText(sanitizeText(data.iapData?.preparedBy || ''), {
        x: ICS_208_BLOCKS.preparedByName.x, y: ICS_208_BLOCKS.preparedByName.y,
        size: ICS_208_BLOCKS.preparedByName.fontSize, font, color: rgb(0, 0, 0),
      });
      page.drawText(sanitizeText(data.iapData?.preparedByPosition || ''), {
        x: ICS_208_BLOCKS.preparedByPosition.x, y: ICS_208_BLOCKS.preparedByPosition.y,
        size: ICS_208_BLOCKS.preparedByPosition.fontSize, font, color: rgb(0, 0, 0),
      });
      const preparedDateTime = data.iapData?.preparedDateTime
        ? formatDateTime(data.iapData.preparedDateTime.split('T')[0], data.iapData.preparedDateTime.split('T')[1]?.substring(0, 5) || '')
        : formatDateTime(new Date().toISOString().split('T')[0], new Date().toTimeString().split(' ')[0].substring(0, 5));
      page.drawText(sanitizeText(preparedDateTime), {
        x: ICS_208_BLOCKS.preparedByDateTime.x, y: ICS_208_BLOCKS.preparedByDateTime.y,
        size: ICS_208_BLOCKS.preparedByDateTime.fontSize, font, color: rgb(0, 0, 0),
      });
    };

    // --- Render ---
    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const page = pageIdx === 0
        ? pdfDoc.getPages()[0]
        : await createContinuationPage(pdfDoc, TEMPLATE_URLS.ICS_208);

      drawHeader(page);

      const isLastMsgPage = pageIdx === msgPages.length - 1;
      const isExtraLocPage = pageIdx === msgPages.length;

      if (!isExtraLocPage) {
        // Safety message content for this page
        let y = contentStartY;
        for (const line of msgPages[pageIdx]) {
          page.drawText(line, { x: startX, y, size: fontSize, font, color: rgb(0, 0, 0) });
          y -= lineHeight;
        }
      }

      if (isLastMsgPage) {
        // Footer with checkbox, first location line, and prepared by always on the last message page
        drawFooter(page);
      }

      if (isExtraLocPage) {
        // Draw continuation text in Section 4, starting at the "Located At:" row (y=99)
        // and flowing downward. No Prepared by values are drawn on this page so the
        // only thing below is the printed template label, which is acceptable.
        let locY = locStartY;
        for (const line of locRestLines) {
          if (locY < 20) break;
          page.drawText(line, {
            x: ICS_208_BLOCKS.siteSafetyPlanLocation.x,
            y: locY,
            size: locFontSize,
            font,
            color: rgb(0, 0, 0),
            maxWidth: locMaxWidth,
          });
          locY -= locLineH;
        }
      }

      addOpPeriodFooter(page, font);
    }

    const allPages = pdfDoc.getPages();
    if (allPages.length > 1) {
      allPages.forEach((p, i) => drawPageNumber(p, i + 1, allPages.length, 'ICS 208'));
    }

    return await pdfDoc.save();
  }

  async generateICS233(data: ICSFormData): Promise<Uint8Array> {
    const pdfDoc = await loadTemplateFirstPage(TEMPLATE_URLS.ICS_233);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.getPages()[0];
    const { height } = page.getSize();

    // Header - Incident Name
    drawBoundedText(
      page,
      data.iapData?.incidentName || data.iapData?.name || '',
      80,
      height - 65,
      font,
      10,
      300
    );

    // Operational Period
    const opFrom = formatDateTime(this.isoDate(data.periodData?.startAt, data.periodData?.fromDate), this.isoTime(data.periodData?.startAt, data.periodData?.fromTime));
    const opTo = formatDateTime(this.isoDate(data.periodData?.endAt, data.periodData?.toDate), this.isoTime(data.periodData?.endAt, data.periodData?.toTime));

    drawBoundedText(
      page,
      opFrom,
      420,
      height - 65,
      font,
      9,
      180
    );

    drawBoundedText(
      page,
      opTo,
      420,
      height - 80,
      font,
      9,
      180
    );

    // Action Items Table
    const actionItems = data.formData || [];
    const filteredItems = actionItems.filter((item: any) =>
      item.includedInPrint &&
      item.status !== 'Cancelled' &&
      item.status !== 'Closed'
    );

    let yPos = height - 130;
    const rowHeight = 20;

    filteredItems.slice(0, 25).forEach((item: any) => {
      // Number
      drawBoundedText(page, item.number?.toString() || '', 40, yPos, font, 8, 30);

      // Item description
      drawBoundedText(page, item.item || '', 75, yPos, font, 8, 180);

      // For/POC
      drawBoundedText(page, item.forPoc || '', 260, yPos, font, 8, 100);

      // Briefed POC
      drawCheckbox(page, 365, yPos - 3, 8, item.briefedPoc);

      // Start Date
      const startDate = item.startDate ? formatDate(item.startDate) : '';
      drawBoundedText(page, startDate, 385, yPos, font, 8, 60);

      // Status
      drawBoundedText(page, item.status || '', 450, yPos, font, 8, 60);

      // Target Date
      const targetDate = item.targetDate ? formatDate(item.targetDate) : '';
      drawBoundedText(page, targetDate, 515, yPos, font, 8, 60);

      yPos -= rowHeight;
    });

    // Prepared by footer
    drawBoundedText(
      page,
      data.iapData?.preparedBy || '',
      80,
      60,
      font,
      9,
      180
    );

    const preparedDateTime = data.iapData?.preparedDateTime
      ? formatDateTime(
          data.iapData.preparedDateTime.split('T')[0],
          data.iapData.preparedDateTime.split('T')[1]?.substring(0, 5) || ''
        )
      : formatDateTime(
          new Date().toISOString().split('T')[0],
          new Date().toTimeString().split(' ')[0].substring(0, 5)
        );

    drawBoundedText(
      page,
      preparedDateTime,
      350,
      60,
      font,
      9,
      120
    );

    // Add OpPeriod footer
    addOpPeriodFooter(page, font);

    return await pdfDoc.save();
  }
}

export const icsFormGenerator = new ICSFormGenerator();

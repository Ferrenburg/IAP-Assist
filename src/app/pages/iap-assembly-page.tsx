'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Upload, QrCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '../../utils/api-client';
import { useOpPeriod } from '../../contexts/op-period-context';
import { icsFormGenerator } from '../../utils/ics-forms/form-generator';
import { generateWeatherPDF } from '../../utils/ics-forms/generators/weather-pdf';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { toast } from 'sonner';

interface FormSelection {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  requiresData?: boolean;
}

export function IAPAssemblyPage() {
  const { iapId, periodId } = useParams();
  const { data: shared } = useOpPeriod();
  const [iapData, setIAPData] = useState<any>(null);
  const [periodData, setPeriodData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');

  // Form metadata — seeded from shared context, user-editable before export
  const [preparedByName, setPreparedByName] = useState('');
  const [preparedByPosition, setPreparedByPosition] = useState('');
  const [preparedDate, setPreparedDate] = useState('');
  const [preparedTime, setPreparedTime] = useState('');
  const [approvedByName, setApprovedByName] = useState('');

  // Logo upload
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // QR Code
  const [includeQRCode, setIncludeQRCode] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');

  // Weather data availability
  const [weatherAvailable, setWeatherAvailable] = useState<boolean | null>(null);

  // Form selection
  const [forms, setForms] = useState<FormSelection[]>([
    {
      id: 'cover',
      title: 'IAP Cover Page',
      description: 'Cover page with incident information, logo, and approval signatures',
      checked: true,
      requiresData: false,
    },
    {
      id: 'ics202',
      title: 'ICS 202 - Incident Objectives',
      description: 'Operational objectives, command emphasis, and situational awareness',
      checked: true,
      requiresData: true,
    },
    {
      id: 'ics203',
      title: 'ICS 203 - Organization Assignment List',
      description: 'ICS organizational structure and personnel assignments',
      checked: true,
      requiresData: true,
    },
    {
      id: 'ics204',
      title: 'ICS 204 - Assignment List',
      description: 'Division/group assignments, work assignments, and special instructions',
      checked: true,
      requiresData: true,
    },
    {
      id: 'ics205',
      title: 'ICS 205 - Radio Communications Plan',
      description: 'Radio frequency assignments and communications procedures',
      checked: true,
      requiresData: true,
    },
    {
      id: 'ics205a',
      title: 'ICS 205A - Communications List',
      description: 'Contact information for key personnel',
      checked: true,
      requiresData: true,
    },
    {
      id: 'ics206',
      title: 'ICS 206 - Medical Plan',
      description: 'Medical aid stations, transportation, and hospital information',
      checked: true,
      requiresData: true,
    },
    {
      id: 'ics207',
      title: 'ICS 207 - Incident Organization Chart',
      description: 'Visual representation of the ICS organizational structure',
      checked: true,
      requiresData: true,
    },
    {
      id: 'ics208',
      title: 'ICS 208 - Safety Message/Plan',
      description: 'Safety messages, hazards, and site safety plan information',
      checked: true,
      requiresData: true,
    },
    {
      id: 'weather',
      title: 'Weather Forecast',
      description: 'NWS weather forecast — fetch data on the Weather page first to enable',
      checked: false,
      requiresData: false,
    },
  ]);

  useEffect(() => {
    loadData();
    checkWeatherAvailability();
    // Auto-populate date/time
    const now = new Date();
    setPreparedDate(now.toISOString().split('T')[0]);
    setPreparedTime(now.toTimeString().slice(0, 5));
  }, [iapId, periodId]);

  // Seed shared fields from context when context data arrives.
  // These stay editable so the user can override before generating.
  useEffect(() => {
    if (!shared) return;
    if (shared.preparedByName) setPreparedByName(shared.preparedByName);
    if (shared.preparedByTitle) setPreparedByPosition(shared.preparedByTitle);
    // approvedByName is the IC's signature block on the cover. Use the explicit
    // approvedByName if set, otherwise fall back to the IC name entered on the forms.
    const icName = shared.approvedByName || shared.incidentCommander;
    if (icName) setApprovedByName(icName);
    // Auto-load the org logo saved in Account Settings — user can still override.
    if (shared.agencyLogoUrl && !logoPreview) {
      setLogoPreview(shared.agencyLogoUrl);
    }
  }, [shared]);

  // Transform personnel data to organization format expected by ICS forms
  const transformPersonnelToOrganization = (personnelData: any) => {
    if (!personnelData) return [];

    const organizationData = [];

    // Add command staff
    if (personnelData.commandStructure === 'single' && personnelData.incidentCommanderName) {
      organizationData.push({ position: 'Incident Commander', name: personnelData.incidentCommanderName });
    } else if (personnelData.commandStructure === 'unified' && personnelData.commanders) {
      personnelData.commanders.forEach((cmd: any) => {
        if (cmd.name) organizationData.push({ position: 'Incident Commander', name: cmd.name });
      });
    }
    if (personnelData.deputyIncidentCommanderName) organizationData.push({ position: 'Deputy Incident Commander', name: personnelData.deputyIncidentCommanderName });
    if (personnelData.safetyOfficerName) organizationData.push({ position: 'Safety Officer', name: personnelData.safetyOfficerName });
    if (personnelData.publicInfoOfficerName) organizationData.push({ position: 'Public Information Officer', name: personnelData.publicInfoOfficerName });
    if (personnelData.liaisonOfficerName) organizationData.push({ position: 'Liaison Officer', name: personnelData.liaisonOfficerName });

    // Add agency reps
    if (personnelData.agencyReps) {
      personnelData.agencyReps.forEach((rep: any) => {
        if (rep.representative) organizationData.push({ position: 'Agency Representative', name: rep.representative, agency: rep.agency });
      });
    }

    // Operations Section
    if (personnelData.operationsSectionChief) organizationData.push({ position: 'Operations Section Chief', name: personnelData.operationsSectionChief });
    if (personnelData.operationsDeputyChief) organizationData.push({ position: 'Deputy Operations Section Chief', name: personnelData.operationsDeputyChief });
    if (personnelData.stagingAreaManager) organizationData.push({ position: 'Staging Area Manager', name: personnelData.stagingAreaManager });

    // Planning Section
    if (personnelData.planningSectionChief) organizationData.push({ position: 'Planning Section Chief', name: personnelData.planningSectionChief });
    if (personnelData.planningDeputy) organizationData.push({ position: 'Deputy Planning Section Chief', name: personnelData.planningDeputy });
    if (personnelData.resourcesUnitLeader) organizationData.push({ position: 'Resources Unit Leader', name: personnelData.resourcesUnitLeader });
    if (personnelData.situationUnitLeader) organizationData.push({ position: 'Situation Unit Leader', name: personnelData.situationUnitLeader });
    if (personnelData.documentationUnitLeader) organizationData.push({ position: 'Documentation Unit Leader', name: personnelData.documentationUnitLeader });
    if (personnelData.demobilizationUnitLeader) organizationData.push({ position: 'Demobilization Unit Leader', name: personnelData.demobilizationUnitLeader });

    // Technical Specialists
    if (personnelData.technicalSpecialists) {
      personnelData.technicalSpecialists.forEach((spec: any) => {
        if (spec.name) organizationData.push({ position: 'Technical Specialist', name: spec.name });
      });
    }

    // Logistics Section
    if (personnelData.logisticsSectionChief) organizationData.push({ position: 'Logistics Section Chief', name: personnelData.logisticsSectionChief });
    if (personnelData.logisticsDeputy) organizationData.push({ position: 'Deputy Logistics Section Chief', name: personnelData.logisticsDeputy });
    if (personnelData.supportBranchDirector) organizationData.push({ position: 'Support Branch Director', name: personnelData.supportBranchDirector });
    if (personnelData.supplyUnitLeader) organizationData.push({ position: 'Supply Unit Leader', name: personnelData.supplyUnitLeader });
    if (personnelData.facilitiesUnitLeader) organizationData.push({ position: 'Facilities Unit Leader', name: personnelData.facilitiesUnitLeader });
    if (personnelData.groundSupportUnitLeader) organizationData.push({ position: 'Ground Support Unit Leader', name: personnelData.groundSupportUnitLeader });
    if (personnelData.serviceBranchDirector) organizationData.push({ position: 'Service Branch Director', name: personnelData.serviceBranchDirector });
    if (personnelData.communicationsUnitLeader) organizationData.push({ position: 'Communications Unit Leader', name: personnelData.communicationsUnitLeader });
    if (personnelData.medicalUnitLeader) organizationData.push({ position: 'Medical Unit Leader', name: personnelData.medicalUnitLeader });
    if (personnelData.foodUnitLeader) organizationData.push({ position: 'Food Unit Leader', name: personnelData.foodUnitLeader });

    // Finance/Admin Section
    if (personnelData.financeSectionChief) organizationData.push({ position: 'Finance/Administration Section Chief', name: personnelData.financeSectionChief });
    if (personnelData.financeDeputy) organizationData.push({ position: 'Deputy Finance/Administration Section Chief', name: personnelData.financeDeputy });
    if (personnelData.timeUnitLeader) organizationData.push({ position: 'Time Unit Leader', name: personnelData.timeUnitLeader });
    if (personnelData.procurementUnitLeader) organizationData.push({ position: 'Procurement Unit Leader', name: personnelData.procurementUnitLeader });
    if (personnelData.compensationClaimsUnitLeader) organizationData.push({ position: 'Compensation/Claims Unit Leader', name: personnelData.compensationClaimsUnitLeader });
    if (personnelData.costUnitLeader) organizationData.push({ position: 'Cost Unit Leader', name: personnelData.costUnitLeader });

    return organizationData;
  };

  const checkWeatherAvailability = async () => {
    if (!iapId || !periodId) return;
    try {
      const weatherRes = await apiClient.getData(iapId, `period-${periodId}-weather`);
      const hasData = !!(weatherRes?.data?.[0]?.forecast?.length);
      setWeatherAvailable(hasData);
      if (hasData) {
        setForms(prev => prev.map(f => f.id === 'weather' ? { ...f, checked: true } : f));
      }
    } catch {
      setWeatherAvailable(false);
    }
  };

  const loadData = async () => {
    if (!iapId || !periodId) return;

    try {
      const [iapRes, periodsData] = await Promise.all([
        apiClient.getIAP(iapId),
        apiClient.getData(iapId, 'periods'),
      ]);

      setIAPData(iapRes.iap);
      const period = periodsData?.data?.find((p: any) => p.id === periodId);
      setPeriodData(period);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load IAP data');
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file (PNG or JPG)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleForm = (formId: string) => {
    setForms(forms.map(f =>
      f.id === formId ? { ...f, checked: !f.checked } : f
    ));
  };

  const generateCoverPage = async (): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const PW = 612;
    const PH = 792;

    const font    = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const NAVY    = rgb(0.08, 0.18, 0.38);
    const GOLD    = rgb(0.80, 0.60, 0.10);
    const WHITE   = rgb(1, 1, 1);
    const DARK    = rgb(0.12, 0.12, 0.12);
    const MID     = rgb(0.35, 0.35, 0.35);
    const LIGHT   = rgb(0.94, 0.95, 0.97);

    // ── Top header bar ──────────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: PH - 110, width: PW, height: 110, color: NAVY });
    // Gold accent strip
    page.drawRectangle({ x: 0, y: PH - 113, width: PW, height: 3, color: GOLD });

    // Agency logo (top-left inside header)
    // Cap logo width at 160pt so the heading text always has room on the right.
    const MAX_LOGO_W = 160;
    let logoEndX = 56;
    if (logoPreview) {
      try {
        const logoBytes = await fetch(logoPreview).then(r => r.arrayBuffer());
        const logoImage = logoPreview.toLowerCase().includes('png')
          ? await pdfDoc.embedPng(logoBytes)
          : await pdfDoc.embedJpg(logoBytes);
        const logoH = 78;
        const naturalW = (logoImage.width / logoImage.height) * logoH;
        const logoW = Math.min(naturalW, MAX_LOGO_W);
        page.drawImage(logoImage, { x: 24, y: PH - 100, width: logoW, height: logoH });
        logoEndX = 24 + logoW + 14;
      } catch (err) {
        console.error('Failed to embed logo:', err);
      }
    }

    // "INCIDENT ACTION PLAN" header text — maxWidth guards against any remaining overflow.
    page.drawText('INCIDENT ACTION PLAN', {
      x: logoEndX, y: PH - 52, size: 22, font: boldFont, color: WHITE,
      maxWidth: PW - logoEndX - 20,
    });
    page.drawText('OPERATIONAL PERIOD DOCUMENT', {
      x: logoEndX, y: PH - 72, size: 10, font, color: rgb(0.72, 0.80, 0.94),
      maxWidth: PW - logoEndX - 20,
    });

    // ── Incident Name band ───────────────────────────────────────────────────
    const incidentName = iapData?.name || 'Unnamed Incident';
    page.drawRectangle({ x: 0, y: PH - 165, width: PW, height: 52, color: LIGHT });
    page.drawRectangle({ x: 0, y: PH - 165, width: 6, height: 52, color: GOLD });

    const nameSize = incidentName.length > 40 ? 16 : 20;
    page.drawText(incidentName, {
      x: 24, y: PH - 142, size: nameSize, font: boldFont, color: NAVY,
      maxWidth: PW - 48,
    });

    // ── Op Period block ──────────────────────────────────────────────────────
    const fmtDate = (iso: string | null | undefined) => {
      if (!iso) return '—';
      return new Date(iso).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false,
      });
    };

    let y = PH - 210;
    page.drawText('OPERATIONAL PERIOD', { x: 40, y, size: 8, font: boldFont, color: GOLD });
    y -= 14;
    page.drawText(`From:  ${fmtDate(periodData?.startAt)}`, { x: 40, y, size: 11, font, color: DARK });
    y -= 16;
    page.drawText(`To:      ${fmtDate(periodData?.endAt)}`, { x: 40, y, size: 11, font, color: DARK });

    // Incident number (right column)
    if (iapData?.incidentNumber) {
      page.drawText('INCIDENT NUMBER', { x: 360, y: PH - 210, size: 8, font: boldFont, color: GOLD });
      page.drawText(iapData.incidentNumber, { x: 360, y: PH - 224, size: 11, font, color: DARK });
    }

    y -= 30;
    // Thin rule
    page.drawLine({ start: { x: 40, y }, end: { x: PW - 40, y }, thickness: 0.5, color: rgb(0.78, 0.78, 0.78) });
    y -= 24;

    // ── Signature blocks ─────────────────────────────────────────────────────
    const drawSigBlock = (
      title: string,
      name: string,
      position: string,
      dateTime: string,
      xLeft: number,
      yTop: number,
      blockW: number,
    ) => {
      page.drawRectangle({ x: xLeft, y: yTop - 130, width: blockW, height: 130, color: LIGHT });
      page.drawRectangle({ x: xLeft, y: yTop, width: blockW, height: 20, color: NAVY });
      page.drawText(title, { x: xLeft + 8, y: yTop + 5, size: 9, font: boldFont, color: WHITE });

      let sy = yTop - 22;
      page.drawText('Name:', { x: xLeft + 8, y: sy, size: 8, font: boldFont, color: MID });
      page.drawText(name || '________________________________', { x: xLeft + 8, y: sy - 13, size: 10, font, color: DARK });

      sy -= 38;
      page.drawText('Position / Title:', { x: xLeft + 8, y: sy, size: 8, font: boldFont, color: MID });
      page.drawText(position || '________________________________', { x: xLeft + 8, y: sy - 13, size: 10, font, color: DARK });

      sy -= 38;
      page.drawText('Signature:', { x: xLeft + 8, y: sy, size: 8, font: boldFont, color: MID });
      page.drawLine({
        start: { x: xLeft + 8, y: sy - 18 },
        end: { x: xLeft + blockW - 8, y: sy - 18 },
        thickness: 0.5, color: rgb(0.6, 0.6, 0.6),
      });

      sy -= 34;
      page.drawText('Date / Time:', { x: xLeft + 8, y: sy, size: 8, font: boldFont, color: MID });
      page.drawText(dateTime || '________________________________', { x: xLeft + 8, y: sy - 13, size: 10, font, color: DARK });
    };

    const BLOCK_W = 248;
    const BLOCK_Y = y;

    drawSigBlock(
      'PREPARED BY — PLANNING SECTION CHIEF',
      preparedByName,
      preparedByPosition,
      `${preparedDate}  ${preparedTime}`,
      40,
      BLOCK_Y,
      BLOCK_W,
    );

    drawSigBlock(
      'APPROVED BY — INCIDENT COMMANDER',
      approvedByName,
      'Incident Commander',
      '',
      PW - 40 - BLOCK_W,
      BLOCK_Y,
      BLOCK_W,
    );

    y = BLOCK_Y - 130 - 24;

    // ── IAP Contents summary ─────────────────────────────────────────────────
    page.drawText('CONTENTS OF THIS IAP', { x: 40, y, size: 8, font: boldFont, color: GOLD });
    y -= 14;

    const includedForms = forms.filter(f => f.checked).map(f => f.title);
    const cols = 2;
    const colW = (PW - 80) / cols;
    includedForms.forEach((title, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      page.drawText(`•  ${title}`, {
        x: 40 + col * colW,
        y: y - row * 14,
        size: 9,
        font,
        color: DARK,
        maxWidth: colW - 10,
      });
    });
    y -= (Math.ceil(includedForms.length / cols)) * 14 + 16;

    // ── Footer bar ───────────────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: 0, width: PW, height: 36, color: NAVY });
    page.drawText('CONFIDENTIAL — FOR AUTHORIZED PERSONNEL ONLY', {
      x: 40, y: 14, size: 8, font: boldFont, color: rgb(0.72, 0.80, 0.94),
    });
    page.drawText(`Generated by OpPeriod  |  ${new Date().toLocaleString()}`, {
      x: PW - 40 - font.widthOfTextAtSize(`Generated by OpPeriod  |  ${new Date().toLocaleString()}`, 7),
      y: 14, size: 7, font, color: rgb(0.55, 0.62, 0.75),
    });

    // QR Code note (if enabled)
    if (includeQRCode && publicUrl) {
      page.drawText('Digital access:', { x: 40, y: 52, size: 8, font: boldFont, color: MID });
      page.drawText(publicUrl, { x: 110, y: 52, size: 8, font, color: rgb(0.15, 0.35, 0.75), maxWidth: PW - 150 });
    }

    return await pdfDoc.save();
  };

  const generateIAP = async () => {
    if (!iapId || !periodId) return;

    const selectedForms = forms.filter(f => f.checked);
    if (selectedForms.length === 0) {
      toast.error('Please select at least one form to include');
      return;
    }

    setGenerating(true);
    setProgress('Gathering form data...');

    try {
      const pdfDocs: Uint8Array[] = [];
      let runningPageCount = 0;

      // Helper: push a generated PDF and update the running page count
      const pushPdf = async (pdfBytes: Uint8Array) => {
        pdfDocs.push(pdfBytes);
        const tempDoc = await PDFDocument.load(pdfBytes);
        runningPageCount += tempDoc.getPageCount();
      };

      // Generate each selected form
      for (const form of selectedForms) {
        setProgress(`Generating ${form.title}...`);

        try {
          if (form.id === 'cover') {
            const coverPdf = await generateCoverPage();
            await pushPdf(coverPdf);
          } else if (form.id === 'ics202') {
            const objectivesData = await apiClient.getData(iapId, `period-${periodId}-objectives`);
            const commandData = await apiClient.getData(iapId, `period-${periodId}-command-emphasis`);
            const situationData = await apiClient.getData(iapId, `period-${periodId}-situation`);
            const personnelDataRaw = await apiClient.getData(iapId, `period-${periodId}-personnel`);

            // Transform personnel data from flat object to organization array
            const personnelDataFlat = personnelDataRaw?.data?.[0];
            const organizationData = transformPersonnelToOrganization(personnelDataFlat);

            console.log('[ICS 202 Data Debug]', {
              objectives: objectivesData?.data,
              command: commandData?.data,
              situation: situationData?.data,
              personnelRaw: personnelDataFlat,
              organizationTransformed: organizationData,
            });

            const pdf = await icsFormGenerator.generateICS202({
              iapData: { ...iapData, preparedBy: preparedByName, preparedByPosition, preparedDateTime: `${preparedDate}T${preparedTime}` },
              periodData,
              formData: objectivesData?.data || [],
              commandEmphasis: commandData?.data?.[0]?.content || '',
              situationConditions: situationData?.data?.[0]?.content || '',
              organizationData: organizationData,
            });
            await pushPdf(pdf);
          } else if (form.id === 'ics203') {
            const personnelDataRaw = await apiClient.getData(iapId, `period-${periodId}-personnel`);
            const assignmentsDataRaw = await apiClient.getData(iapId, `period-${periodId}-assignments`);

            // Transform personnel data from flat object to organization array
            const personnelDataFlat = personnelDataRaw?.data?.[0];
            const organizationData = transformPersonnelToOrganization(personnelDataFlat);

            // Transform assignments data for Operations Section (branches/divisions)
            const assignments = assignmentsDataRaw?.data || [];
            const branchesData = assignments
              .filter((a: any) => a.divisionGroupType === 'branch')
              .map((a: any) => ({
                name: a.name || '',
                directorName: a.supervisorName || '',
              }));

            const divisionsData = assignments
              .filter((a: any) => a.divisionGroupType === 'division' || a.divisionGroupType === 'group')
              .map((a: any) => ({
                position: a.name || '',
                name: a.supervisorName || '',
                type: a.divisionGroupType,
                branch: a.branch || null,
              }));

            console.log('[ICS 203 Data Debug]', {
              personnelRaw: personnelDataFlat,
              organizationTransformed: organizationData,
              assignmentsRaw: assignments,
              divisions: divisionsData,
              branches: branchesData,
            });

            const pdf = await icsFormGenerator.generateICS203({
              iapData,
              periodData,
              organizationData: organizationData,
              divisionsData: divisionsData,
              branchesData: branchesData,
            });
            await pushPdf(pdf);
          } else if (form.id === 'ics204') {
            const [assignmentsData, prepData, personnelData] = await Promise.all([
              apiClient.getData(iapId, `period-${periodId}-assignments`),
              apiClient.getData(iapId, `period-${periodId}-assignments-prep`),
              apiClient.getData(iapId, `period-${periodId}-personnel`),
            ]);
            const assignments: any[] = assignmentsData?.data || [];
            const personnel = personnelData?.data?.[0];
            const prep = prepData?.data?.[0] || {};

            const ics204IapData = {
              ...iapData,
              preparedBy: preparedByName || iapData?.preparedByName,
              preparedByPosition: preparedByPosition || iapData?.preparedByTitle,
              preparedDateTime: `${preparedDate}T${preparedTime}`,
            };

            // One PDF page per assignment, each stamped with its IAP page number
            for (let i = 0; i < assignments.length; i++) {
              const assignment = assignments[i];
              let branchDirector = '';
              let branchDirectorContact = '';
              if (assignment.branch && assignment.divisionGroupType !== 'branch') {
                const linked = assignments.find((a: any) => a.divisionGroupType === 'branch' && a.name === assignment.branch);
                branchDirector = linked?.supervisorName || '';
                branchDirectorContact = linked?.supervisorContact || '';
              }
              const assignmentPdf = await icsFormGenerator.generateICS204({
                iapData: ics204IapData,
                periodData,
                formData: [{
                  division: assignment.name,
                  divisionGroupType: assignment.divisionGroupType,
                  branch: assignment.branch || '',
                  reportingLocation: assignment.reportingLocation || '',
                  supervisor: assignment.supervisorName || '',
                  supervisorContact: assignment.supervisorContact || '',
                  resources: assignment.resources || [],
                  workAssignment: assignment.workAssignments || '',
                  specialInstructions: assignment.specialInstructions || '',
                  communications: assignment.contacts || [],
                }],
                operationsSectionChief: personnel?.operationsSectionChief || '',
                operationsSectionChiefContact: personnel?.operationsSectionChiefContact || '',
                branchDirector,
                branchDirectorContact,
                iapPageNumber: runningPageCount + 1,
                preparedBy: preparedByName,
                preparedByPosition,
                preparedDateTime: prep.dateTimePrepared || `${preparedDate}T${preparedTime}`,
              });
              await pushPdf(assignmentPdf);
            }
          } else if (form.id === 'ics205') {
            const channelsData = await apiClient.getData(iapId, `period-${periodId}-radio-channels`);

            const pdf = await icsFormGenerator.generateICS205({
              iapData,
              periodData,
              formData: channelsData?.data || [],
            });
            await pushPdf(pdf);
          } else if (form.id === 'ics205a') {
            const contactsData = await apiClient.getData(iapId, `period-${periodId}-comms-contacts`);

            const pdf = await icsFormGenerator.generateICS205A({
              iapData,
              periodData,
              formData: contactsData?.data || [],
            });
            await pushPdf(pdf);
          } else if (form.id === 'ics206') {
            const medicalData = await apiClient.getData(iapId, `period-${periodId}-medical-data`);
            const stationsData = await apiClient.getData(iapId, `period-${periodId}-medical-stations`);
            const transportData = await apiClient.getData(iapId, `period-${periodId}-transportation`);
            const hospitalsData = await apiClient.getData(iapId, `period-${periodId}-hospitals`);
            const personnelDataRaw = await apiClient.getData(iapId, `period-${periodId}-personnel`);

            // Transform personnel data from flat object to organization array
            const personnelDataFlat = personnelDataRaw?.data?.[0];
            const organizationData = transformPersonnelToOrganization(personnelDataFlat);

            const pdf = await icsFormGenerator.generateICS206({
              iapData,
              periodData,
              medicalData: medicalData?.data?.[0] || {},
              aidStations: stationsData?.data || [],
              transportation: transportData?.data || [],
              hospitals: hospitalsData?.data || [],
              organizationData: organizationData,
            });
            await pushPdf(pdf);
          } else if (form.id === 'ics207') {
            const personnelDataRaw = await apiClient.getData(iapId, `period-${periodId}-personnel`);

            // Transform personnel data from flat object to organization array
            const personnelDataFlat = personnelDataRaw?.data?.[0];
            const organizationData = transformPersonnelToOrganization(personnelDataFlat);

            const pdf = await icsFormGenerator.generateICS207({
              iapData,
              periodData,
              organizationData: organizationData,
            });
            await pushPdf(pdf);
          } else if (form.id === 'ics208') {
            const safetyData = await apiClient.getData(iapId, `period-${periodId}-safety-data`);
            const personnelDataRaw = await apiClient.getData(iapId, `period-${periodId}-personnel`);

            // Transform personnel data from flat object to organization array
            const personnelDataFlat = personnelDataRaw?.data?.[0];
            const organizationData = transformPersonnelToOrganization(personnelDataFlat);

            const pdf = await icsFormGenerator.generateICS208({
              iapData,
              periodData,
              formData: safetyData?.data || [],
              organizationData: organizationData,
            });
            await pushPdf(pdf);
          } else if (form.id === 'weather') {
            const weatherRes = await apiClient.getData(iapId, `period-${periodId}-weather`);
            const weatherData = weatherRes?.data?.[0];
            if (!weatherData || !weatherData.forecast?.length) {
              toast.warning('No weather data found — visit the Weather page to fetch forecast data first. Skipping weather attachment.');
            } else {
              const weatherPdf = await generateWeatherPDF({
                locationName: weatherData.locationName || '',
                latitude: weatherData.latitude || '',
                longitude: weatherData.longitude || '',
                weatherPoint: weatherData.weatherPoint || null,
                forecast: weatherData.forecast || [],
                alerts: weatherData.alerts || [],
                generatedAt: weatherData.lastUpdated || new Date().toLocaleString(),
              });
              await pushPdf(weatherPdf);
            }
          }
        } catch (err) {
          console.error(`Failed to generate ${form.title}:`, err);
          toast.error(`Failed to generate ${form.title}`);
          throw err;
        }
      }

      // Merge all PDFs
      setProgress('Merging PDFs...');
      const mergedPdf = await PDFDocument.create();

      for (const pdfBytes of pdfDocs) {
        const pdf = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }

      // Add page numbers
      const pages = mergedPdf.getPages();
      const helvetica = await mergedPdf.embedFont('Helvetica');
      pages.forEach((page, i) => {
        const { width } = page.getSize();
        const pageNum = `Page ${i + 1} of ${pages.length}`;
        page.drawText(pageNum, {
          x: width - 80,
          y: 20,
          size: 8,
          font: helvetica,
          color: { type: 'RGB', red: 0.5, green: 0.5, blue: 0.5 },
        });
      });

      const finalPdf = await mergedPdf.save();

      // Download PDF
      const blob = new Blob([finalPdf], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      a.download = `IAP_${iapData?.name?.replace(/\s+/g, '_')}_OP-${periodData?.periodNumber}_${timestamp}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('IAP generated successfully!');
      setProgress('');
    } catch (err) {
      console.error('Failed to generate IAP:', err);
      toast.error('Failed to generate IAP');
      setProgress('');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600">Loading IAP data...</p>
        </div>
      </div>
    );
  }

  const formatISODate = (iso: string | null | undefined) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">IAP Assembly</h1>
        <p className="text-slate-600">Generate a complete Incident Action Plan with all selected forms</p>
      </div>

      {/* IAP Metadata */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">IAP Metadata</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Incident Name</label>
              <input
                type="text"
                value={iapData?.name || ''}
                disabled
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Operational Period</label>
              <input
                type="text"
                value={periodData ? `${formatISODate(periodData.startAt)} - ${formatISODate(periodData.endAt)}` : ''}
                disabled
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prepared by: Name</label>
              <input
                type="text"
                value={preparedByName}
                onChange={(e) => setPreparedByName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Position/Title</label>
              <input
                type="text"
                value={preparedByPosition}
                onChange={(e) => setPreparedByPosition(e.target.value)}
                placeholder="e.g., Planning Section Chief"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date Prepared</label>
              <input
                type="date"
                value={preparedDate}
                onChange={(e) => setPreparedDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Time Prepared</label>
              <input
                type="time"
                value={preparedTime}
                onChange={(e) => setPreparedTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Approved by Incident Commander: Name</label>
            <input
              type="text"
              value={approvedByName}
              onChange={(e) => setApprovedByName(e.target.value)}
              placeholder="Enter IC name"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* IAP Cover Section */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">IAP Cover</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Agency Logo</label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors">
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-700">Upload Logo</span>
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              {logoFile && (
                <span className="text-sm text-slate-600">{logoFile.name}</span>
              )}
            </div>
          </div>

          {logoPreview && (
            <div className="border border-slate-300 rounded-lg p-4 bg-slate-50">
              <p className="text-sm font-medium text-slate-700 mb-2">Preview:</p>
              <img src={logoPreview} alt="Logo preview" className="max-h-24 object-contain" />
            </div>
          )}
        </div>
      </div>

      {/* Form Selection */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Select Forms to Include</h2>

        <div className="space-y-3">
          {forms.map((form) => (
            <label
              key={form.id}
              className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={form.checked}
                onChange={() => toggleForm(form.id)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-yellow-600 focus:ring-yellow-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-slate-900">{form.title}</span>
                  {form.id === 'weather' && weatherAvailable !== null && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${weatherAvailable ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {weatherAvailable ? 'Data ready' : 'No data — visit Weather page first'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-1">{form.description}</p>
              </div>
              {form.checked && form.requiresData && (
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-1" />
              )}
            </label>
          ))}
        </div>
      </div>

      {/* QR Code Option */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={includeQRCode}
            onChange={(e) => setIncludeQRCode(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-slate-300 text-yellow-600 focus:ring-yellow-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-slate-600" />
              <span className="font-medium text-slate-900">Include QR Code for Public Access</span>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              When enabled, the IAP will be uploaded to public storage and a QR code will be added to the cover page for mobile access.
            </p>
          </div>
        </label>

        {includeQRCode && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Public URL (optional)</label>
            <input
              type="url"
              value={publicUrl}
              onChange={(e) => setPublicUrl(e.target.value)}
              placeholder="https://example.com/iap/..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={generateIAP}
          disabled={generating || forms.every(f => !f.checked)}
          className="bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Generate IAP
            </>
          )}
        </button>

        {forms.every(f => !f.checked) && (
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">Select at least one form to generate</span>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      {progress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900">{progress}</p>
        </div>
      )}
    </div>
  );
}

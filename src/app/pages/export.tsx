'use client';

import { PageHeader } from '../components/page-header';
import { Download, FileText, CheckSquare, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '../../utils/api-client';
import { icsFormGenerator } from '../../utils/ics-forms/form-generator';
import { pdfCombiner } from '../../utils/pdf-combiner';
import { toast } from 'sonner';

export function Export() {
  const { iapId } = useParams();
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [packetType, setPacketType] = useState<'draft' | 'final'>('final');
  const [iapData, setIapData] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const forms = [
    { code: 'ICS 202', title: 'Incident Objectives' },
    { code: 'ICS 203', title: 'Organization Assignment List' },
    { code: 'ICS 204', title: 'Assignment List' },
    { code: 'ICS 205', title: 'Incident Radio Communications Plan' },
    { code: 'ICS 205A', title: 'Communications List' },
    { code: 'ICS 206', title: 'Medical Plan' },
    { code: 'ICS 207', title: 'Incident Organization Chart' },
    { code: 'ICS 208', title: 'Safety Message/Plan' },
  ];

  useEffect(() => {
    loadExportData();
  }, [iapId]);

  const loadExportData = async () => {
    if (!iapId) return;

    try {
      setLoading(true);
      const [
        iapRes,
        periodsRes,
        objectivesRes,
        organizationRes,
        assignmentsRes,
        communicationsRes,
        contactsRes,
        medicalRes,
        safetyRes,
        branchesRes,
      ] = await Promise.all([
        apiClient.getIAP(iapId),
        apiClient.getPeriods(iapId),
        apiClient.getObjectives(iapId),
        apiClient.getData(iapId, 'organization'),
        apiClient.getData(iapId, 'assignments'),
        apiClient.getData(iapId, 'communications'),
        apiClient.getData(iapId, 'contacts'),
        apiClient.getData(iapId, 'medical'),
        apiClient.getData(iapId, 'safety'),
        apiClient.getData(iapId, 'branches'),
      ]);

      setIapData(iapRes.iap);
      setPeriods(periodsRes.periods || []);

      setFormData({
        objectives: objectivesRes?.objectives || [],
        organization: organizationRes?.data || [],
        assignments: assignmentsRes?.data || [],
        communications: communicationsRes?.data || [],
        contacts: contactsRes?.data || [],
        medical: medicalRes?.data || [],
        safety: safetyRes?.data || [],
        branches: branchesRes?.data || [],
      });

      // Select the active period by default
      const activePeriod = periodsRes.periods?.find((p: any) => p.status === 'active');
      if (activePeriod) {
        setSelectedPeriod(activePeriod.id);
      } else if (periodsRes.periods?.length > 0) {
        setSelectedPeriod(periodsRes.periods[0].id);
      }
    } catch (err) {
      console.error('Failed to load export data:', err);
      toast.error('Failed to load export data');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${time}`;
  };

  const handleDownloadPacket = async () => {
    if (!iapId || !selectedPeriod) return;

    try {
      setGenerating(true);
      toast.info('Generating IAP packet...');

      const period = periods.find((p) => p.id === selectedPeriod);
      if (!period) {
        toast.error('Selected operational period not found');
        setGenerating(false);
        return;
      }

      const pdfBuffers: Uint8Array[] = [];

      const baseData = { iapData, periodData: period, organizationData: formData.organization, safetyData: formData.safety, branchesData: formData.branches };

      // Generate all forms in order using FEMA block structure
      const formGenerators = [
        { name: 'ICS 202', fn: async () => await icsFormGenerator.generateICS202({ ...baseData, formData: formData.objectives }) },
        { name: 'ICS 203', fn: async () => await icsFormGenerator.generateICS203({ ...baseData, formData: formData.organization }) },
        { name: 'ICS 204', fn: async () => await icsFormGenerator.generateICS204({ ...baseData, formData: formData.assignments }) },
        { name: 'ICS 205', fn: async () => await icsFormGenerator.generateICS205({ ...baseData, formData: formData.communications }) },
        { name: 'ICS 205A', fn: async () => await icsFormGenerator.generateICS205A({ ...baseData, formData: formData.contacts }) },
        { name: 'ICS 206', fn: async () => await icsFormGenerator.generateICS206({ ...baseData, formData: formData.medical }) },
        { name: 'ICS 207', fn: async () => await icsFormGenerator.generateICS207({ ...baseData, formData: formData.organization }) },
        { name: 'ICS 208', fn: async () => await icsFormGenerator.generateICS208({ ...baseData, formData: formData.safety }) },
      ];

      for (const form of formGenerators) {
        try {
          const pdfBytes = await form.fn();
          pdfBuffers.push(pdfBytes);
        } catch (error) {
          console.error(`Error generating ${form.name}:`, error);

          // Show user-friendly error
          const errorMsg = error instanceof Error ? error.message : String(error);
          if (errorMsg.includes('408') || errorMsg.includes('timeout')) {
            toast.error(`${form.name}: Server timeout. Try again or check console for details.`);
          } else {
            toast.error(`Failed to generate ${form.name}: ${errorMsg.substring(0, 100)}`);
          }
        }
      }

      // Combine all PDFs
      const combinedPdf = await pdfCombiner.combinePDFs(pdfBuffers);

      // Download the combined PDF
      const filename = `IAP_${iapData?.name || 'Incident'}_${period.number}_${packetType}.pdf`;
      await pdfCombiner.downloadPDF(combinedPdf, filename);

      // If this is a final export, mark the IAP as exported
      if (packetType === 'final' && iapId) {
        try {
          await apiClient.updateIAP(iapId, {
            lastExportDate: new Date().toISOString(),
            status: 'in-progress', // Mark as active
          });
        } catch (error) {
          console.error('Failed to update IAP export status:', error);
        }
      }

      toast.success('IAP packet generated successfully!');
    } catch (error) {
      console.error('Error generating IAP packet:', error);
      toast.error('Failed to generate IAP packet');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadForm = async (formCode: string, formTitle: string) => {
    if (!iapId || !selectedPeriod) return;

    try {
      toast.info(`Generating ${formCode}...`);

      const period = periods.find((p) => p.id === selectedPeriod);
      if (!period) {
        toast.error('Selected operational period not found');
        return;
      }

      const baseData = { iapData, periodData: period, organizationData: formData.organization, safetyData: formData.safety, branchesData: formData.branches };

      let pdfBytes: Uint8Array;

      // Generate form using FEMA block structure
      switch (formCode) {
        case 'ICS 202':
          pdfBytes = await icsFormGenerator.generateICS202({ ...baseData, formData: formData.objectives });
          break;
        case 'ICS 203':
          pdfBytes = await icsFormGenerator.generateICS203({ ...baseData, formData: formData.organization });
          break;
        case 'ICS 204':
          pdfBytes = await icsFormGenerator.generateICS204({ ...baseData, formData: formData.assignments });
          break;
        case 'ICS 205':
          pdfBytes = await icsFormGenerator.generateICS205({ ...baseData, formData: formData.communications });
          break;
        case 'ICS 205A':
          pdfBytes = await icsFormGenerator.generateICS205A({ ...baseData, formData: formData.communications });
          break;
        case 'ICS 206':
          pdfBytes = await icsFormGenerator.generateICS206({ ...baseData, formData: formData.medical });
          break;
        case 'ICS 207':
          pdfBytes = await icsFormGenerator.generateICS207({ ...baseData, formData: formData.organization });
          break;
        case 'ICS 208':
          pdfBytes = await icsFormGenerator.generateICS208({ ...baseData, formData: formData.safety });
          break;
        default:
          toast.error('Unknown form type');
          return;
      }

      const filename = `${formCode.replace(' ', '_')}_${iapData?.name || 'Incident'}_${period.number}.pdf`;
      await pdfCombiner.downloadPDF(pdfBytes, filename);

      toast.success(`${formCode} downloaded successfully!`);
    } catch (error) {
      console.error(`Error generating ${formCode}:`, error);
      toast.error(`Failed to generate ${formCode}`);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading export options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <PageHeader
        title="Export"
        description="Download your Incident Action Plan packet or individual forms"
      />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Export Full IAP Packet</h3>
            <p className="text-sm text-slate-600 mb-6">Download all selected forms as a single PDF document ready for distribution.</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Packet Type</label>
                <div className="flex gap-3">
                  <label className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-slate-50 ${packetType === 'draft' ? 'border-yellow-600 bg-yellow-50' : 'border-slate-300'}`}>
                    <input
                      type="radio"
                      name="packetType"
                      value="draft"
                      checked={packetType === 'draft'}
                      onChange={() => setPacketType('draft')}
                      className="text-yellow-600 focus:ring-yellow-500"
                    />
                    <span className="text-sm text-slate-900">Draft</span>
                  </label>
                  <label className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-slate-50 ${packetType === 'final' ? 'border-yellow-600 bg-yellow-50' : 'border-slate-300'}`}>
                    <input
                      type="radio"
                      name="packetType"
                      value="final"
                      checked={packetType === 'final'}
                      onChange={() => setPacketType('final')}
                      className="text-yellow-600 focus:ring-yellow-500"
                    />
                    <span className="text-sm text-slate-900">Final</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Operational Period</label>
                {periods.length > 0 ? (
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                    {periods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.number} - {formatDateTime(period.startDate, period.startTime)} to {formatDateTime(period.endDate, period.endTime)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-4 py-2 border border-amber-300 bg-amber-50 rounded-lg text-sm text-amber-800">
                    No operational periods configured. Create one in the Operational Periods page.
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleDownloadPacket}
              disabled={periods.length === 0 || generating}
              className="w-full bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download Full IAP Packet (PDF)
                </>
              )}
            </button>
            {periods.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">Create an operational period to enable downloads.</p>
            )}
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Export Individual Forms</h3>
            <p className="text-sm text-slate-600 mb-6">Download specific ICS forms separately as needed.</p>

            <div className="space-y-2">
              {forms.map((form) => (
                <div key={form.code} className="flex items-center justify-between px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-900">{form.code} - {form.title}</span>
                  </div>
                  <button
                    onClick={() => handleDownloadForm(form.code, form.title)}
                    disabled={periods.length === 0}
                    className="text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

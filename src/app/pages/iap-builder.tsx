'use client';

import { PageHeader } from '../components/page-header';
import { StatusBadge } from '../components/status-badge';
import { FileText, AlertCircle, CheckCircle2, Eye, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { apiClient } from '../../utils/api-client';

interface FormStatus {
  code: string;
  title: string;
  status: 'complete' | 'incomplete' | 'missing';
  required: boolean;
  included: boolean;
  section: string;
}

interface Warning {
  form: string;
  message: string;
}

export function IAPBuilder() {
  const { iapId } = useParams();
  const [loading, setLoading] = useState(true);
  const [iapData, setIapData] = useState<any>(null);
  const [currentPeriod, setCurrentPeriod] = useState<any>(null);
  const [forms, setForms] = useState<FormStatus[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);

  useEffect(() => {
    loadBuilderData();
  }, [iapId]);

  const loadBuilderData = async () => {
    if (!iapId) return;

    try {
      setLoading(true);

      // Load IAP data
      const { iap } = await apiClient.getIAP(iapId);
      setIapData(iap);

      // Load operational periods
      const { periods } = await apiClient.getPeriods(iapId);
      const activePeriod = periods.find((p: any) => p.status === 'active');
      setCurrentPeriod(activePeriod || periods[0]);

      // Load data for each section
      const [
        objectivesRes,
        organizationRes,
        assignmentsRes,
        communicationsRes,
        medicalRes,
        safetyRes,
      ] = await Promise.all([
        apiClient.getObjectives(iapId),
        apiClient.getData(iapId, 'organization'),
        apiClient.getData(iapId, 'assignments'),
        apiClient.getData(iapId, 'communications'),
        apiClient.getData(iapId, 'medical'),
        apiClient.getData(iapId, 'safety'),
      ]);

      // Calculate status for each form
      const calculateStatus = (data: any[] | undefined): 'complete' | 'incomplete' | 'missing' => {
        if (!data || data.length === 0) return 'missing';
        return 'complete'; // Any data present means the form is complete
      };

      const objectivesStatus = calculateStatus(objectivesRes?.objectives);
      const organizationStatus = calculateStatus(organizationRes?.data);
      const assignmentsStatus = calculateStatus(assignmentsRes?.data);
      const communicationsStatus = calculateStatus(communicationsRes?.data);
      const medicalStatus = calculateStatus(medicalRes?.data);
      const safetyStatus = calculateStatus(safetyRes?.data);

      const formStatuses: FormStatus[] = [
        { code: 'ICS 202', title: 'Incident Objectives', status: objectivesStatus, required: true, included: true, section: 'objectives' },
        { code: 'ICS 203', title: 'Organization Assignment List', status: organizationStatus, required: true, included: true, section: 'organization' },
        { code: 'ICS 204', title: 'Assignment List', status: assignmentsStatus, required: true, included: true, section: 'assignments' },
        { code: 'ICS 205', title: 'Incident Radio Communications Plan', status: communicationsStatus, required: true, included: true, section: 'communications' },
        { code: 'ICS 205A', title: 'Communications List', status: communicationsStatus, required: false, included: true, section: 'communications' },
        { code: 'ICS 206', title: 'Medical Plan', status: medicalStatus, required: false, included: true, section: 'medical' },
        { code: 'ICS 207', title: 'Incident Organization Chart', status: organizationStatus, required: false, included: true, section: 'organization' },
        { code: 'ICS 208', title: 'Safety Message/Plan', status: safetyStatus, required: false, included: true, section: 'safety' },
      ];

      setForms(formStatuses);

      // Generate warnings
      const generatedWarnings: Warning[] = [];

      if (!objectivesRes?.objectives || objectivesRes.objectives.length === 0) {
        generatedWarnings.push({ form: 'ICS 202', message: 'No objectives added' });
      }
      if (!organizationRes?.data || organizationRes.data.length === 0) {
        generatedWarnings.push({ form: 'ICS 203', message: 'No organization staff assigned' });
      }
      if (!assignmentsRes?.data || assignmentsRes.data.length === 0) {
        generatedWarnings.push({ form: 'ICS 204', message: 'No assignments created' });
      }
      if (!communicationsRes?.data || communicationsRes.data.length === 0) {
        generatedWarnings.push({ form: 'ICS 205', message: 'No radio channels configured' });
      }
      if (!medicalRes?.data || medicalRes.data.length === 0) {
        generatedWarnings.push({ form: 'ICS 206', message: 'No medical facilities added' });
      }
      if (!safetyRes?.data || safetyRes.data.length === 0) {
        generatedWarnings.push({ form: 'ICS 208', message: 'No safety information entered' });
      }

      setWarnings(generatedWarnings);
    } catch (err) {
      console.error('Failed to load IAP builder data:', err);
    } finally {
      setLoading(false);
    }
  };

  const completeCount = forms.filter(f => f.status === 'complete').length;
  const totalCount = forms.length;

  const formatDateTime = (date: string, time: string) => {
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${time}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading IAP builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <PageHeader
        title="IAP Builder"
        description="Assemble and review your Incident Action Plan packet"
        action={
          <Link
            href={`/iap/${iapId}/export`}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview & Export
          </Link>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{currentPeriod?.number || 'No Operational Period'}</h3>
                <p className="text-sm text-slate-600 mt-1">
                  {currentPeriod
                    ? `${formatDateTime(currentPeriod.startDate, currentPeriod.startTime)} - ${formatDateTime(currentPeriod.endDate, currentPeriod.endTime)}`
                    : 'No operational period configured'
                  }
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">Completion Status</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">{completeCount}/{totalCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-yellow-600 h-full transition-all"
                  style={{ width: `${(completeCount / totalCount) * 100}%` }}
                />
              </div>
              <span className="text-slate-600 font-medium">{Math.round((completeCount / totalCount) * 100)}%</span>
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900 mb-2">Warnings ({warnings.length})</p>
                  <ul className="space-y-1">
                    {warnings.map((warning, idx) => (
                      <li key={idx} className="text-sm text-amber-800">
                        <span className="font-medium">{warning.form}:</span> {warning.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Included Forms</h3>
              <p className="text-sm text-slate-600 mt-1">Forms in packet order for this operational period</p>
            </div>
            <div className="divide-y divide-slate-200">
              {forms.map((form) => (
                <div key={form.code} className="flex items-center gap-4 px-6 py-4">
                  <input
                    type="checkbox"
                    checked={form.included}
                    disabled={form.required}
                    readOnly
                    className="w-4 h-4 rounded border-slate-300 text-yellow-600 focus:ring-yellow-500 disabled:opacity-50"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">{form.code}</p>
                      {form.required && (
                        <span className="text-xs text-slate-500">(Required)</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{form.title}</p>
                    <Link href={`/iap/${iapId}/${form.section}`} className="text-xs text-yellow-600 hover:text-yellow-700 mt-1 inline-block">
                      Edit in {form.section.charAt(0).toUpperCase() + form.section.slice(1)} →
                    </Link>
                  </div>
                  <StatusBadge status={form.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-80 bg-white border-l border-slate-200 p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Packet Summary</h3>

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs font-medium text-slate-600">Incident Name</label>
              <p className="text-sm text-slate-900 mt-1">{iapData?.incidentName || 'Not set'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Incident Number</label>
              <p className="text-sm text-slate-900 mt-1">{iapData?.incidentNumber || 'Not set'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Operational Period</label>
              <p className="text-sm text-slate-900 mt-1">{currentPeriod?.number || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Date/Time</label>
              <p className="text-sm text-slate-900 mt-1">
                {currentPeriod
                  ? `${formatDateTime(currentPeriod.startDate, currentPeriod.startTime).split(' ')[0]} ${currentPeriod.startTime}-${currentPeriod.endTime}`
                  : '-'
                }
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Quick Stats</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total Forms</span>
                <span className="text-sm font-medium text-slate-900">{totalCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Required</span>
                <span className="text-sm font-medium text-slate-900">{forms.filter(f => f.required).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Complete</span>
                <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {completeCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Warnings</span>
                <span className="text-sm font-medium text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {warnings.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { PageHeader } from '../components/page-header';
import { StatusBadge } from '../components/status-badge';
import { CheckCircle2, AlertCircle, Clock, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { apiClient } from '../../utils/api-client';

interface SectionStatus {
  name: string;
  status: 'complete' | 'incomplete' | 'missing';
  form: string;
  path: string;
}

export function Dashboard() {
  const { iapId } = useParams();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [iapData, setIapData] = useState<any>(null);
  const [sections, setSections] = useState<SectionStatus[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, [iapId, pathname]);

  const loadDashboardData = async () => {
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

      // Load data for each section to determine status
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

      // Calculate status for each section
      const calculateStatus = (data: any[] | undefined): 'complete' | 'incomplete' | 'missing' => {
        if (!data || data.length === 0) return 'missing';
        return 'complete'; // Any data present means the section is complete
      };

      const incidentInfoStatus = (iap?.incidentName && iap?.incidentNumber) ? 'complete' : 'incomplete';

      const sectionStatuses: SectionStatus[] = [
        { name: 'Incident Info', status: incidentInfoStatus, form: '-', path: `/iap/${iapId}/incident-info` },
        { name: 'Objectives', status: calculateStatus(objectivesRes?.objectives), form: 'ICS 202', path: `/iap/${iapId}/objectives` },
        { name: 'Organization', status: calculateStatus(organizationRes?.data), form: 'ICS 203, 207', path: `/iap/${iapId}/organization` },
        { name: 'Assignments', status: calculateStatus(assignmentsRes?.data), form: 'ICS 204', path: `/iap/${iapId}/assignments` },
        { name: 'Communications', status: calculateStatus(communicationsRes?.data), form: 'ICS 205, 205A', path: `/iap/${iapId}/communications` },
        { name: 'Medical', status: calculateStatus(medicalRes?.data), form: 'ICS 206', path: `/iap/${iapId}/medical` },
        { name: 'Safety', status: calculateStatus(safetyRes?.data), form: 'ICS 208', path: `/iap/${iapId}/safety` },
      ];

      setSections(sectionStatuses);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const completeCount = sections.filter(s => s.status === 'complete').length;
  const incompleteCount = sections.filter(s => s.status === 'incomplete').length;
  const missingCount = sections.filter(s => s.status === 'missing').length;
  const totalCount = sections.length;

  const stats = [
    { label: 'Forms Complete', value: `${completeCount}/${totalCount}`, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'In Progress', value: incompleteCount.toString(), icon: Clock, color: 'text-amber-600' },
    { label: 'Not Started', value: missingCount.toString(), icon: AlertCircle, color: 'text-slate-500' },
    { label: 'Current OP', value: currentPeriod?.number || '-', icon: FileText, color: 'text-yellow-600' },
  ];

  const formatDateTime = (date: string, time: string) => {
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${time}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-slate-400 text-sm">Incident planning overview and status</p>
        </div>
        <Link
          href={`/iap/${iapId}/iap-builder`}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
        >
          Open IAP Builder
        </Link>
      </div>

      <div>
        <div className="mb-8">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Current Incident</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-slate-600">Incident Name:</span>
                <span className="text-sm font-medium text-slate-900 ml-2">{iapData?.incidentName || 'Not set'}</span>
              </div>
              <div>
                <span className="text-sm text-slate-600">Incident Number:</span>
                <span className="text-sm font-medium text-slate-900 ml-2">{iapData?.incidentNumber || 'Not set'}</span>
              </div>
              <div>
                <span className="text-sm text-slate-600">Operational Period:</span>
                <span className="text-sm font-medium text-slate-900 ml-2">
                  {currentPeriod
                    ? `${formatDateTime(currentPeriod.startDate, currentPeriod.startTime)} - ${formatDateTime(currentPeriod.endDate, currentPeriod.endTime)}`
                    : 'No operational period set'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">{stat.label}</p>
                    <p className="text-2xl font-semibold text-slate-900 mt-1">{stat.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Section Status</h3>
            <p className="text-sm text-slate-600 mt-1">Track completion of planning sections and forms</p>
          </div>
          <div className="divide-y divide-slate-200">
            {sections.map((section) => (
              <Link
                key={section.name}
                href={section.path}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{section.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{section.form}</p>
                </div>
                <StatusBadge status={section.status} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

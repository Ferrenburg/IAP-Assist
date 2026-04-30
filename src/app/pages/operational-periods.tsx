'use client';

import { PageHeader } from '../components/page-header';
import { Plus, Copy, Calendar, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '../../utils/api-client';

interface Period {
  id: string;
  number: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  status: 'active' | 'completed' | 'planned';
}

export function OperationalPeriods() {
  const { iapId } = useParams();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPeriods();
  }, [iapId]);

  const loadPeriods = async () => {
    if (!iapId) return;

    try {
      setLoading(true);
      const { periods: data } = await apiClient.getPeriods(iapId);
      setPeriods(data.sort((a: any, b: any) => {
        const numA = parseInt(a.number.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.number.replace(/\D/g, '')) || 0;
        return numB - numA; // Most recent first
      }));
    } catch (err) {
      console.error('Failed to load periods:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!iapId || !formData.startDate || !formData.endDate) return;

    try {
      setSaving(true);
      const nextNumber = periods.length > 0
        ? Math.max(...periods.map(p => parseInt(p.number.replace(/\D/g, '')) || 0)) + 1
        : 1;

      await apiClient.createPeriod(iapId, {
        number: `OP ${nextNumber}`,
        startDate: formData.startDate,
        startTime: formData.startTime || '0600',
        endDate: formData.endDate,
        endTime: formData.endTime || '1800',
        status: nextNumber === 1 ? 'active' : 'planned',
      });

      setFormData({ startDate: '', startTime: '', endDate: '', endTime: '' });
      setShowAddForm(false);
      await loadPeriods();
    } catch (err) {
      console.error('Failed to add period:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${time}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading operational periods...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <PageHeader
        title="Operational Periods"
        description="Create and manage operational periods for planning cycles"
        action={
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Operational Period
          </button>
        }
      />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Planning Cycles</p>
            <p className="text-sm text-blue-700 mt-0.5">Each operational period represents a planning cycle for your incident. Forms are assembled for the selected operational period.</p>
          </div>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-lg border-2 border-yellow-500 mb-6 p-6">
            <h4 className="font-semibold text-slate-900 mb-4">New Operational Period</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date*</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  placeholder="0600"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">End Date*</label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  placeholder="1800"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !formData.startDate || !formData.endDate}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Period
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {periods.map((period) => (
            <div
              key={period.id}
              className={`bg-white rounded-lg border-2 overflow-hidden transition-all ${
                period.status === 'active' ? 'border-yellow-500 shadow-md' : 'border-slate-200'
              }`}
            >
              <div className="px-6 py-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold text-slate-900">{period.number}</h3>
                    {period.status === 'active' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Active Period
                      </span>
                    )}
                    {period.status === 'completed' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        Completed
                      </span>
                    )}
                    {period.status === 'planned' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Planned
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-600">Start Date/Time</label>
                      <p className="text-sm text-slate-900 mt-1">
                        {formatDateTime(period.startDate, period.startTime)}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">End Date/Time</label>
                      <p className="text-sm text-slate-900 mt-1">
                        {formatDateTime(period.endDate, period.endTime)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-6">
                  {period.status === 'completed' && (
                    <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
                      <Copy className="w-4 h-4" />
                      Copy Forward
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {periods.length === 0 && !showAddForm && (
            <div className="bg-white rounded-lg border border-slate-200 py-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium mb-2">No operational periods yet</p>
              <p className="text-sm text-slate-500 mb-4">Create your first operational period to begin planning</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 text-yellow-600 hover:text-yellow-700 font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Create Operational Period
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

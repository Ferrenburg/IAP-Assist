'use client';

import { Target, Users, ClipboardList, Radio, Heart, Cloud, ListChecks, FileStack, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../utils/api-client';
import { useAuth } from '../../contexts/auth-context';
import opLogo from '../../imports/OP_Logo.png';

const tabs = [
  { id: 'objectives', label: 'Objectives', icon: Target, path: '/objectives' },
  { id: 'personnel', label: 'Personnel', icon: Users, path: '/personnel' },
  { id: 'assignments', label: 'Assignments', icon: ClipboardList, path: '/assignments' },
  { id: 'communications', label: 'Communications', icon: Radio, path: '/communications' },
  { id: 'safety-medical', label: 'Safety & Medical', icon: Heart, path: '/safety-medical' },
  { id: 'weather', label: 'Weather', icon: Cloud, path: '/weather' },
  { id: 'action-tracker', label: 'Action Tracker', icon: ListChecks, path: '/action-tracker' },
  { id: 'iap-assembly', label: 'IAP Assembly', icon: FileStack, path: '/iap-assembly' },
];

export function WorkspaceHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { iapId, periodId } = useParams();
  const { user, logout } = useAuth();
  const [currentPeriod, setCurrentPeriod] = useState<any>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPeriodInfo();
  }, [iapId, periodId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadPeriodInfo = async () => {
    if (!iapId || !periodId) return;

    try {
      const periodsData = await apiClient.getData(iapId, 'periods');
      const period = periodsData?.data?.find((p: any) => p.id === periodId);
      setCurrentPeriod(period);
    } catch (err) {
      console.error('Failed to load period info:', err);
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.push('/');
  };

  const formatPeriodRange = (period: any) => {
    const fmt = (date: string, time: string) =>
      new Date(`${date}T${time}`).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    return `${fmt(period.fromDate, period.fromTime)} – ${fmt(period.toDate, period.toTime)}`;
  };

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <img src={opLogo} alt="OpPeriod" className="h-6" />
        </div>

        {currentPeriod && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Period {currentPeriod.periodNumber}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 font-normal">{formatPeriodRange(currentPeriod)}</span>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <div className="relative" ref={settingsMenuRef}>
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Settings & utilities"
            >
              <Settings className="w-4 h-4" />
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
                <div className="py-1">
                  {[
                    { label: 'Team', path: '/team' },
                    { label: 'Defaults', path: '/defaults' },
                    { label: 'Templates', path: '/templates' },
                    { label: 'Utilities', path: '/utilities' },
                  ].map(({ label, path }) => (
                    <button
                      key={path}
                      onClick={() => { setShowSettingsMenu(false); router.push(path); }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-slate-700 font-medium">{user?.user_metadata?.name || user?.name || 'User'}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showAccountMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">{user?.user_metadata?.name || user?.name || 'User'}</p>
                  <p className="text-xs text-slate-500">{user?.email || ''}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setShowAccountMenu(false); router.push('/account-settings'); }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Account Settings
                  </button>
                  <button
                    onClick={() => { setShowAccountMenu(false); handleSignOut(); }}
                    className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-0.5 overflow-x-auto px-4 border-t border-slate-100">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const fullPath = `/iap/${iapId}/period/${periodId}${tab.path}`;
          const isActive = pathname === fullPath;
          const isAssembly = tab.id === 'iap-assembly';

          return (
            <Link
              key={tab.id}
              to={fullPath}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
                isActive
                  ? isAssembly
                    ? 'text-emerald-700 border-emerald-500'
                    : 'text-slate-900 border-emerald-500'
                  : isAssembly
                  ? 'text-emerald-600 border-transparent hover:text-emerald-700 hover:bg-emerald-50'
                  : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}

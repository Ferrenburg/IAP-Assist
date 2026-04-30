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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPeriodInfo();
  }, [iapId, periodId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    if (showAccountMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAccountMenu]);

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

  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <header className="bg-slate-900 border-b border-slate-700">
      {/* Top banner with logo and account */}
      <div className="px-6 py-3 border-b border-slate-700 flex items-center justify-between bg-[#000000]">
        <div className="flex items-center gap-3">
          <img src={opLogo} alt="OpPeriod" className="h-6" />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/team')}
            className="px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors"
          >
            Team
          </button>
          <button
            onClick={() => router.push('/defaults')}
            className="px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors"
          >
            Defaults
          </button>
          <button
            onClick={() => router.push('/templates')}
            className="px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors"
          >
            Templates
          </button>
          <button
            onClick={() => router.push('/utilities')}
            className="px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors"
          >
            Utilities
          </button>
          <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <div className="w-7 h-7 bg-yellow-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-slate-300">{user?.user_metadata?.name || user?.name || 'User'}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showAccountMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-700">
                <p className="text-sm font-medium text-white">{user?.user_metadata?.name || user?.name || 'User'}</p>
                <p className="text-xs text-slate-400">{user?.email || ''}</p>
              </div>
              <div className="py-2">
                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    router.push('/account-settings');
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Account Settings
                </button>
                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    handleSignOut();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700 transition-colors flex items-center gap-2"
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

      {/* Period info banner */}
      {currentPeriod && (
        <div className="px-6 py-2 border-b border-slate-700 bg-slate-900/50">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Current Period:</span>
            <span className="text-yellow-400 font-medium">Period {currentPeriod.periodNumber}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">
              {formatDateTime(currentPeriod.fromDate, currentPeriod.fromTime)} - {formatDateTime(currentPeriod.toDate, currentPeriod.toTime)}
            </span>
          </div>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex gap-1 overflow-x-auto px-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const fullPath = `/iap/${iapId}/period/${periodId}${tab.path}`;
          const isActive = pathname === fullPath;

          return (
            <Link
              key={tab.id}
              to={fullPath}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
                isActive
                  ? 'text-white border-yellow-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
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

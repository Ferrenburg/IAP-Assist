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
    <header className="bg-card border-b border-border">
      <div className="px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="cursor-pointer">
            <img src={opLogo} alt="OpPeriod" className="h-6" />
          </Link>
          {!iapId && (
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              ← All Incidents
            </Link>
          )}
        </div>

        {currentPeriod && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent rounded-full text-xs font-medium text-foreground border border-border">
            <span className="w-1.5 h-1.5 rounded-full bg-sage shrink-0" />
            <span>Period {currentPeriod.periodNumber}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground font-normal">{formatPeriodRange(currentPeriod)}</span>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <div className="relative" ref={settingsMenuRef}>
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Settings & utilities"
            >
              <Settings className="w-4 h-4" />
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
                <div className="py-1">
                  {[
                    { label: 'Team', path: '/team' },
                    { label: 'Defaults', path: '/defaults' },
                    { label: 'Utilities', path: '/utilities' },
                  ].map(({ label, path }) => (
                    <button
                      key={path}
                      onClick={() => { setShowSettingsMenu(false); router.push(path); }}
                      className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors"
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
              className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-accent transition-colors"
            >
              <div className="w-7 h-7 bg-sage rounded-full flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-foreground font-medium">{user?.user_metadata?.name || user?.name || 'User'}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>

            {showAccountMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground">{user?.user_metadata?.name || user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setShowAccountMenu(false); router.push('/account-settings'); }}
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    Account Settings
                  </button>
                  <button
                    onClick={() => { setShowAccountMenu(false); handleSignOut(); }}
                    className="w-full px-4 py-2 text-left text-sm text-coral hover:bg-accent transition-colors flex items-center gap-2"
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

      {iapId && periodId && <div className="flex gap-0.5 overflow-x-auto px-4 border-t border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const fullPath = iapId && periodId ? `/iap/${iapId}/period/${periodId}${tab.path}` : '#';
          const isActive = pathname === fullPath;
          const isAssembly = tab.id === 'iap-assembly';

          return (
            <Link
              key={tab.id}
              href={fullPath}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
                isActive
                  ? isAssembly
                    ? 'text-sage-hover border-sage'
                    : 'text-foreground border-sage'
                  : isAssembly
                  ? 'text-sage border-transparent hover:text-sage-hover hover:bg-accent'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-accent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>}
    </header>
  );
}

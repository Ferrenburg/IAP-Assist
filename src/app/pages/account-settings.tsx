'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Building, Phone, Sun, Moon, Monitor } from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import { useTheme } from '../../contexts/theme-context';
import opLogo from '../../imports/OP_Logo.png';

export function AccountSettings() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    phone: '',
    jobTitle: '',
  });

  useEffect(() => {
    // Load user data from auth context or API
    if (user) {
      setFormData({
        name: user.user_metadata?.name || user.name || '',
        email: user.email || '',
        organization: user.user_metadata?.organization || '',
        phone: user.user_metadata?.phone || '',
        jobTitle: user.user_metadata?.jobTitle || '',
      });
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-800 text-white">
      {/* Top Header */}
      <header className="border-b border-slate-700 bg-slate-900">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={opLogo} alt="OpPeriod" className="h-8" />
          </div>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Workspace
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
            <p className="text-slate-400">Manage your account information and preferences</p>
          </div>

          {/* Profile Section */}
          <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{formData.name || 'User'}</h2>
                <p className="text-slate-400 text-sm">{formData.email}</p>
              </div>
            </div>

            <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </div>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </div>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Organization
                  </div>
                </label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Your organization"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </div>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="e.g., Incident Commander"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Appearance</h3>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300 mb-3">Theme</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  theme === 'light'
                    ? 'border-yellow-600 bg-yellow-600/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <Sun className="w-6 h-6 text-slate-300" />
                <span className="text-sm font-medium text-white">Light</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  theme === 'dark'
                    ? 'border-yellow-600 bg-yellow-600/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <Moon className="w-6 h-6 text-slate-300" />
                <span className="text-sm font-medium text-white">Dark</span>
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  theme === 'system'
                    ? 'border-yellow-600 bg-yellow-600/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <Monitor className="w-6 h-6 text-slate-300" />
                <span className="text-sm font-medium text-white">System</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {theme === 'system'
                ? 'Using your system preferences. Currently using ' + (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') + ' mode.'
                : `Using ${theme} mode.`}
            </p>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Subscription</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Current Plan</span>
              <span className="text-white font-medium">Type 2</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Users</span>
              <span className="text-white font-medium">3 / 15</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Renewal Date</span>
              <span className="text-white font-medium">April 25, 2027</span>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-700">
            <button className="text-yellow-600 hover:text-yellow-500 text-sm font-medium transition-colors">
              Upgrade Plan
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

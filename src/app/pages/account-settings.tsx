'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Building, Sun, Moon, Monitor, Upload, X, Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../../contexts/auth-context';
import { useTheme } from '../../contexts/theme-context';
import { projectId, publishableKey } from '../../utils/supabase-info';
import { toast } from 'sonner';
import opLogo from '../../imports/OP_Logo.png';

const supabaseUrl = `https://${projectId}.supabase.co`;

// Creates a Supabase client that forwards the current user's JWT so RLS
// policies apply correctly. Called per-operation so the token is always fresh.
function authedClient() {
  const token = localStorage.getItem('access_token');
  return createClient(supabaseUrl, publishableKey, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function AccountSettings() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  // Personal details
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Organization
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [orgLogoUrl, setOrgLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [savingOrg, setSavingOrg] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.user_metadata?.name ?? '');
    setTitle(user.user_metadata?.title ?? '');
    setEmail(user.email ?? '');
    loadOrg();
  }, [user]);

  const loadOrg = async () => {
    if (!user) return;
    try {
      const db = authedClient();

      const { data: membership, error: mErr } = await db
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (mErr || !membership) {
        console.error('No org membership found:', mErr?.message);
        return;
      }

      setOrgId(membership.org_id);

      const { data: org, error: oErr } = await db
        .from('organizations')
        .select('id, name, logo_url')
        .eq('id', membership.org_id)
        .single();

      if (oErr || !org) {
        console.error('Failed to load org:', oErr?.message);
        return;
      }

      setOrgName(org.name ?? '');
      setOrgLogoUrl(org.logo_url ?? null);
      if (org.logo_url) setLogoPreview(org.logo_url);
    } catch (err) {
      console.error('loadOrg error:', err);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: { name, title } }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.msg || body.error_description || `HTTP ${res.status}`);
      }
      toast.success('Profile saved');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const saveOrgName = async () => {
    if (!orgId) return;
    setSavingOrg(true);
    try {
      const db = authedClient();
      const { error } = await db
        .from('organizations')
        .update({ name: orgName })
        .eq('id', orgId);
      if (error) throw error;
      toast.success('Organization name saved');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save organization');
    } finally {
      setSavingOrg(false);
    }
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a PNG or JPG image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploadingLogo(true);
    try {
      const db = authedClient();
      const ext = file.type.includes('jpeg') || file.type.includes('jpg') ? 'jpg' : 'png';
      const path = `${orgId}/logo.${ext}`;

      const { error: uploadErr } = await db.storage
        .from('agency-logos')
        .upload(path, file, { contentType: file.type, upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = db.storage.from('agency-logos').getPublicUrl(path);
      const logoUrl = urlData.publicUrl;

      const { error: updateErr } = await db
        .from('organizations')
        .update({ logo_url: logoUrl })
        .eq('id', orgId);
      if (updateErr) throw updateErr;

      setOrgLogoUrl(logoUrl);
      setLogoPreview(logoUrl);
      toast.success('Logo uploaded');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to upload logo');
      setLogoPreview(orgLogoUrl);
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = async () => {
    if (!orgId) return;
    try {
      const db = authedClient();
      const { error } = await db
        .from('organizations')
        .update({ logo_url: null })
        .eq('id', orgId);
      if (error) throw error;
      setOrgLogoUrl(null);
      setLogoPreview(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
      toast.success('Logo removed');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to remove logo');
    }
  };

  return (
    <div className="min-h-screen bg-slate-800 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={opLogo.src} alt="OpPeriod" className="h-8" />
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

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-slate-400">Manage your profile, organization, and preferences</p>
        </div>

        {/* Personal Details */}
        <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Personal Details</h2>
              <p className="text-xs text-slate-400">Your name and title auto-populate the Prepared By field on every ICS form.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 cursor-not-allowed"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Position / Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Planning Section Chief"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="flex items-center gap-2 px-5 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Save Profile
            </button>
          </div>
        </div>

        {/* Agency / Organization */}
        <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Building className="w-5 h-5 text-slate-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Agency / Organization</h2>
              <p className="text-xs text-slate-400">Your agency name and logo appear on the IAP cover page and PDF exports.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Agency Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Your agency or organization name"
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <button
                onClick={saveOrgName}
                disabled={savingOrg || !orgId}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {savingOrg ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Agency Logo</label>

            {logoPreview ? (
              <div className="flex items-start gap-4">
                <div className="border border-slate-700 rounded-lg p-3 bg-slate-800 inline-block">
                  <img src={logoPreview} alt="Agency logo" className="max-h-20 max-w-[160px] object-contain" />
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors">
                    <Upload className="w-4 h-4" />
                    Replace
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={removeLogo}
                    className="flex items-center gap-2 px-3 py-1.5 text-red-400 hover:text-red-300 text-sm transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </button>
                </div>
                {uploadingLogo && (
                  <div className="flex items-center gap-2 text-sm text-slate-400 pt-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading…
                  </div>
                )}
              </div>
            ) : (
              <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white text-sm rounded-lg transition-colors ${!orgId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload Logo (PNG or JPG, max 5 MB)
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleLogoFileChange}
                  disabled={!orgId}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Appearance</h3>
          <label className="block text-sm font-medium text-slate-300 mb-3">Theme</label>
          <div className="grid grid-cols-3 gap-3">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  theme === t ? 'border-yellow-600 bg-yellow-600/10' : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                {t === 'light' && <Sun className="w-6 h-6 text-slate-300" />}
                {t === 'dark' && <Moon className="w-6 h-6 text-slate-300" />}
                {t === 'system' && <Monitor className="w-6 h-6 text-slate-300" />}
                <span className="text-sm font-medium text-white capitalize">{t}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Subscription (placeholder) */}
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
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/auth-context';
import {
  Mail,
  Lock,
  User,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import opLogo from '../../imports/OP_Logo.png';
import opLogoTransparent from '../../imports/No_Background_OP_Logo.png';

// Illustrative stand-in for product photography — Apple's tile grammar is
// built around a hero product render; OpPeriod doesn't have one, so this is
// a stylized mockup of the ICS-202 objectives screen rather than a real
// screenshot, framed the same way Apple frames a device (resting on the
// dark tile, single soft shadow, nothing else competing with it).
function ObjectivesMockup() {
  return (
    <div
      className="w-full max-w-sm rounded-lg bg-apple-canvas overflow-hidden"
      style={{ boxShadow: 'rgba(0, 0, 0, 0.22) 3px 5px 30px 0' }}
    >
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-apple-hairline">
        <span className="w-2.5 h-2.5 rounded-full bg-apple-hairline" />
        <span className="w-2.5 h-2.5 rounded-full bg-apple-hairline" />
        <span className="w-2.5 h-2.5 rounded-full bg-apple-hairline" />
        <span className="ml-3 text-[11px] text-apple-ink-muted-48">app.opperiod.com</span>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[13px] font-semibold text-apple-ink">Willow Creek Fire</p>
            <p className="text-[11px] text-apple-ink-muted-48">CA-SHF-000123 · Op Period 3</p>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-apple-divider text-apple-ink-muted-80">
            ICS 202
          </span>
        </div>
        <div className="space-y-2">
          {[
            'Establish containment on the west flank',
            'Protect structures along Ridge Road',
            'Maintain firefighter and public safety',
          ].map((objective) => (
            <div key={objective} className="flex items-center gap-2 rounded-md bg-apple-parchment px-2.5 py-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-apple-blue shrink-0" />
              <span className="text-[11px] text-apple-ink-muted-80 truncate">{objective}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-apple-divider overflow-hidden">
          <div className="h-full w-2/3 rounded-full bg-apple-blue" />
        </div>
      </div>
    </div>
  );
}

export function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();

  const switchMode = (nextIsLogin: boolean) => {
    if (nextIsLogin === isLogin) return;
    setIsLogin(nextIsLogin);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, name, organization);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-apple-canvas flex">
      {/* Dark product tile — Apple's alternating-tile rhythm turned into a
          fixed brand panel: headline + tagline + the illustrative "product"
          resting on the surface with the system's one drop-shadow. */}
      <div className="hidden lg:flex lg:w-1/2 bg-apple-black text-white flex-col justify-between p-12 xl:p-16">
        <img src={opLogo.src} alt="OpPeriod" className="h-8" />

        <div className="max-w-md">
          <h1 className="text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] mb-4">
            Every ICS form, one shared operational period.
          </h1>
          <p className="text-[19px] font-light leading-snug text-apple-body-muted mb-10">
            Enter incident info once. It syncs across every form and the combined IAP export.
          </p>
          <ObjectivesMockup />
        </div>

        <p className="text-xs text-apple-body-muted">
          © {new Date().getFullYear()} OpPeriod. For emergency management and incident command teams.
        </p>
      </div>

      {/* Utility panel — the form itself, in the store/configurator grammar:
          flat white surface, hairline-bordered inputs, one blue pill CTA. */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-apple-parchment lg:bg-apple-canvas">
        <div className="w-full max-w-sm">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1.5 text-sm text-apple-ink-muted-48 hover:text-apple-ink mb-6 transition-colors active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>

          <div className="lg:hidden mb-8 text-center">
            <img src={opLogoTransparent.src} alt="OpPeriod" className="h-7 mx-auto mb-3" />
          </div>

          <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-apple-ink mb-1">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-[15px] text-apple-ink-muted-48 mb-8">
            {isLogin
              ? 'Sign in to pick up where your team left off.'
              : 'Set up your organization in a couple of minutes.'}
          </p>

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => switchMode(true)}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors active:scale-95 ${
                isLogin
                  ? 'bg-apple-blue text-white'
                  : 'bg-transparent text-apple-ink border border-apple-hairline hover:bg-apple-divider'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode(false)}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors active:scale-95 ${
                !isLogin
                  ? 'bg-apple-blue text-white'
                  : 'bg-transparent text-apple-ink border border-apple-hairline hover:bg-apple-divider'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-apple-ink mb-1.5">
                    Full Name*
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-apple-ink-muted-48 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full pl-11 pr-4 py-2.5 bg-apple-canvas border border-apple-hairline rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue-focus focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-apple-ink mb-1.5">
                    Organization*
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-apple-ink-muted-48 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Fire Department, Emergency Services, etc."
                      className="w-full pl-11 pr-4 py-2.5 bg-apple-canvas border border-apple-hairline rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue-focus focus:border-transparent"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-apple-ink mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-apple-ink-muted-48 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-apple-canvas border border-apple-hairline rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue-focus focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-apple-ink mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-apple-ink-muted-48 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? 'Enter your password' : 'Choose a password (8+ chars)'}
                  className="w-full pl-11 pr-11 py-2.5 bg-apple-canvas border border-apple-hairline rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue-focus focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-apple-ink-muted-48 hover:text-apple-ink transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-coral/30 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 text-coral shrink-0 mt-0.5" />
                <p className="text-sm text-coral">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-apple-blue text-white px-4 py-2.5 rounded-full font-medium hover:bg-apple-blue-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-apple-hairline">
            <p className="text-xs text-apple-ink-muted-48 text-center">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => switchMode(!isLogin)}
                className="text-apple-blue font-medium hover:text-apple-blue-hover transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

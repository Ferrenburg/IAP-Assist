'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/auth-context';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ClipboardList,
  Radio,
  ShieldCheck,
} from 'lucide-react';
import opLogo from '../../imports/OP_Logo.png';

const HIGHLIGHTS = [
  {
    icon: ClipboardList,
    title: 'ICS-compliant forms',
    description: 'Objectives, assignments, and org charts generate correctly formatted PDFs every time.',
  },
  {
    icon: Radio,
    title: 'One shared operational period',
    description: 'Enter incident info once — it syncs across every ICS form and the combined IAP export.',
  },
  {
    icon: ShieldCheck,
    title: 'Built for incident command',
    description: 'Designed with emergency management and public safety teams in the loop.',
  },
];

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
    <div className="min-h-screen bg-background flex">
      {/* Brand panel — hidden below lg, mirrors the homepage's dark inverted band so it
          holds up in both themes without its own light/dark overrides. */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-2/5 bg-foreground text-background flex-col justify-between p-12 xl:p-16">
        <div>
          <img src={opLogo.src} alt="OpPeriod" className="h-10" />
        </div>

        <div className="max-w-md">
          <h1 className="text-3xl xl:text-4xl font-bold leading-tight mb-4">
            Incident Action Plans, without the busywork.
          </h1>
          <p className="text-background/70 text-base mb-10">
            OpPeriod keeps every ICS form in sync with a single operational-period
            record, so your team builds the IAP once and exports it clean.
          </p>

          <div className="space-y-6">
            {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-4">
                <div className="w-10 h-10 shrink-0 rounded-2xl bg-background/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-mustard" />
                </div>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-background/60">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-background/50">
          © {new Date().getFullYear()} OpPeriod. For emergency management and incident command teams.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <button
            onClick={() => router.push('/')}
            className="lg:hidden inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>

          <div className="lg:hidden mb-8 text-center">
            <img src={opLogo.src} alt="OpPeriod" className="h-10 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Incident Action Plan Management</p>
          </div>

          <div className="hidden lg:block mb-8">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </button>
            <h2 className="text-2xl font-bold text-foreground">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isLogin
                ? 'Sign in to pick up where your team left off.'
                : 'Set up your organization in a couple of minutes.'}
            </p>
          </div>

          <div className="flex rounded-full bg-muted p-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode(true)}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isLogin
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LogIn className="w-4 h-4 inline mr-2" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode(false)}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !isLogin
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Full Name*
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full pl-11 pr-4 py-2 border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Organization*
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Fire Department, Emergency Services, etc."
                      className="w-full pl-11 pr-4 py-2 border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full pl-11 pr-4 py-2 border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? 'Enter your password' : 'Choose a password (8+ chars)'}
                  className="w-full pl-11 pr-11 py-2 border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-coral/10 border border-coral/30 rounded-2xl p-3">
                <AlertCircle className="w-4 h-4 text-coral shrink-0 mt-0.5" />
                <p className="text-sm text-coral">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-mustard text-foreground px-4 py-2.5 rounded-full font-medium hover:bg-mustard-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => switchMode(!isLogin)}
                className="text-foreground font-medium hover:text-mustard-hover transition-colors"
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

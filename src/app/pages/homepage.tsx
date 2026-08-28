'use client';

import { useRouter } from 'next/navigation';
import { FileText, Users, Shield, Clock, CheckCircle, ArrowRight, Radio, Heart, Calendar, Cloud, ClipboardList, Target } from 'lucide-react';
import opLogo from '../../imports/No_Background_OP_Logo.png';

export function Homepage() {
  const router = useRouter();

  return (
    <div className="legacy-warm-theme min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={opLogo.src} alt="OpPeriod" className="h-12" />
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-mustard-hover transition-colors">Features</a>
            <button
              onClick={() => router.push('/pricing')}
              className="text-sm font-medium text-muted-foreground hover:text-mustard-hover transition-colors"
            >
              Pricing
            </button>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground border border-border rounded-full hover:bg-accent transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/pricing')}
              className="px-5 py-2 text-sm font-medium text-foreground bg-mustard hover:bg-mustard-hover rounded-full transition-colors flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6">
              Streamline Your Incident Action Plans
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              Build professional ICS-compliant IAPs in minutes. OpPeriod simplifies form generation,
              team coordination, and operational planning for emergency management teams.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => router.push('/pricing')}
                className="px-8 py-3.5 text-base font-semibold text-foreground bg-mustard hover:bg-mustard-hover rounded-full transition-colors flex items-center gap-2 shadow-sm"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push('/login')}
                className="px-8 py-3.5 text-base font-semibold text-foreground/80 hover:text-foreground border border-border rounded-full hover:bg-accent transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Everything You Need for IAP Management</h2>
            <p className="text-xl text-muted-foreground">Professional tools designed for incident command teams</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card p-6 border border-border rounded-2xl hover:border-blush hover:shadow-sm transition-all">
              <div className="w-12 h-12 bg-blush rounded-2xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-coral" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Objectives & Planning</h3>
              <p className="text-sm text-muted-foreground">
                Define incident objectives, command emphasis, and situation updates. Track progress across operational periods with ICS 202 forms.
              </p>
            </div>

            <div className="bg-card p-6 border border-border rounded-2xl hover:border-blush hover:shadow-sm transition-all">
              <div className="w-12 h-12 bg-blush rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-coral" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Personnel Management</h3>
              <p className="text-sm text-muted-foreground">
                Build incident command organization charts, assign positions, and manage personnel across all ICS roles with ICS 203 forms.
              </p>
            </div>

            <div className="bg-card p-6 border border-border rounded-2xl hover:border-blush hover:shadow-sm transition-all">
              <div className="w-12 h-12 bg-blush rounded-2xl flex items-center justify-center mb-4">
                <ClipboardList className="w-6 h-6 text-coral" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Work Assignments</h3>
              <p className="text-sm text-muted-foreground">
                Create detailed work assignments for divisions, groups, and staging areas. Define operations, special instructions, and communications per ICS 204.
              </p>
            </div>

            <div className="bg-card p-6 border border-border rounded-2xl hover:border-blush hover:shadow-sm transition-all">
              <div className="w-12 h-12 bg-blush rounded-2xl flex items-center justify-center mb-4">
                <Radio className="w-6 h-6 text-coral" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Communications Plan</h3>
              <p className="text-sm text-muted-foreground">
                Configure radio frequencies, manage channel assignments, and maintain complete communications plans with ICS 205 forms.
              </p>
            </div>

            <div className="bg-card p-6 border border-border rounded-2xl hover:border-blush hover:shadow-sm transition-all">
              <div className="w-12 h-12 bg-blush rounded-2xl flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-coral" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Safety & Medical</h3>
              <p className="text-sm text-muted-foreground">
                Track medical facilities, transportation, and hospital information. Document safety messages and site safety plans using ICS 206 and 208.
              </p>
            </div>

            <div className="bg-card p-6 border border-border rounded-2xl hover:border-blush hover:shadow-sm transition-all">
              <div className="w-12 h-12 bg-blush rounded-2xl flex items-center justify-center mb-4">
                <Cloud className="w-6 h-6 text-coral" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Weather Integration</h3>
              <p className="text-sm text-muted-foreground">
                Real-time weather forecasts from the National Weather Service with current conditions, hourly predictions, extended forecasts, and active alerts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-card border-t border-border">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">Ready to Streamline Your IAP Workflow?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join incident management teams using OpPeriod to respond faster and more effectively.
          </p>
          <button
            onClick={() => router.push('/pricing')}
            className="px-8 py-3.5 text-base font-semibold text-foreground bg-mustard hover:bg-mustard-hover rounded-full transition-colors inline-flex items-center gap-2 shadow-sm"
          >
            Get Started Today
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-background py-12 bg-foreground">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src={opLogo.src} alt="OpPeriod" className="h-8" />
            </div>
            <p className="text-sm text-background/70">
              © 2026 OpPeriod. Incident Action Plan management for emergency response teams.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

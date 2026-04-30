'use client';

import { useRouter } from 'next/navigation';
import { FileText, Users, Shield, Clock, CheckCircle, ArrowRight, Radio, Heart, Calendar, Cloud, ClipboardList, Target } from 'lucide-react';
import opLogo from '../../imports/No_Background_OP_Logo.png';

export function Homepage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={opLogo} alt="OpPeriod" className="h-12" />
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-yellow-600 transition-colors">Features</a>
            <button
              onClick={() => router.push('/pricing')}
              className="text-sm font-medium text-slate-600 hover:text-yellow-600 transition-colors"
            >
              Pricing
            </button>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/pricing')}
              className="px-5 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-8 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
              Streamline Your Incident Action Plans
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto">
              Build professional ICS-compliant IAPs in minutes. OpPeriod simplifies form generation,
              team coordination, and operational planning for emergency management teams.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => router.push('/pricing')}
                className="px-8 py-3.5 text-base font-semibold text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push('/login')}
                className="px-8 py-3.5 text-base font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
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
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything You Need for IAP Management</h2>
            <p className="text-xl text-slate-600">Professional tools designed for incident command teams</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 border border-slate-200 rounded-lg hover:border-yellow-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Objectives & Planning</h3>
              <p className="text-sm text-slate-600">
                Define incident objectives, command emphasis, and situation updates. Track progress across operational periods with ICS 202 forms.
              </p>
            </div>

            <div className="bg-white p-6 border border-slate-200 rounded-lg hover:border-yellow-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Personnel Management</h3>
              <p className="text-sm text-slate-600">
                Build incident command organization charts, assign positions, and manage personnel across all ICS roles with ICS 203 forms.
              </p>
            </div>

            <div className="bg-white p-6 border border-slate-200 rounded-lg hover:border-yellow-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <ClipboardList className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Work Assignments</h3>
              <p className="text-sm text-slate-600">
                Create detailed work assignments for divisions, groups, and staging areas. Define operations, special instructions, and communications per ICS 204.
              </p>
            </div>

            <div className="bg-white p-6 border border-slate-200 rounded-lg hover:border-yellow-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Radio className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Communications Plan</h3>
              <p className="text-sm text-slate-600">
                Configure radio frequencies, manage channel assignments, and maintain complete communications plans with ICS 205 forms.
              </p>
            </div>

            <div className="bg-white p-6 border border-slate-200 rounded-lg hover:border-yellow-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Safety & Medical</h3>
              <p className="text-sm text-slate-600">
                Track medical facilities, transportation, and hospital information. Document safety messages and site safety plans using ICS 206 and 208.
              </p>
            </div>

            <div className="bg-white p-6 border border-slate-200 rounded-lg hover:border-yellow-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Cloud className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Weather Integration</h3>
              <p className="text-sm text-slate-600">
                Real-time weather forecasts from the National Weather Service with current conditions, hourly predictions, extended forecasts, and active alerts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Ready to Streamline Your IAP Workflow?</h2>
          <p className="text-xl text-slate-600 mb-8">
            Join incident management teams using OpPeriod to respond faster and more effectively.
          </p>
          <button
            onClick={() => router.push('/pricing')}
            className="px-8 py-3.5 text-base font-semibold text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm"
          >
            Get Started Today
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-white py-12 bg-[#0f172b29]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src={opLogo} alt="OpPeriod" className="h-8" />
            </div>
            <p className="text-sm text-[#000000]">
              © 2026 OpPeriod. Incident Action Plan management for emergency response teams.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

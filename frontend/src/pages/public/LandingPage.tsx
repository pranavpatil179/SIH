import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import {
  Shield, Building2, Sparkles, CheckCircle2, ArrowRight, Clock,
  FileCheck2, Layers, Cpu, BarChart3, Users, ChevronRight, Lock,
  HelpCircle, Check, X, FileText, Zap, Award
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { HelpGlossaryModal } from '../../components/ui/HelpGlossaryModal';

export default function LandingPage() {
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);

  const handleQuickLogin = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: 'demo1234',
      });
      if (error) throw error;
      toast.success(`Signed in as ${email}`);
      if (email.includes('officer')) {
        navigate('/officer/dashboard');
      } else if (email.includes('admin')) {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error('Quick login failed: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-[#0f172a] flex flex-col font-sans">
      {/* Top Gov Banner */}
      <div className="bg-[#00142e] text-slate-300 text-[11px] sm:text-xs py-1.5 px-3 sm:px-6 border-b border-blue-950 flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
          <span className="truncate">Govt of Maharashtra • Industries, Energy & Labour Department</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[11px]">
          <span>Maharashtra Right to Public Services Act (RTS) Guarantee</span>
          <span>•</span>
          <span className="text-emerald-400 font-medium">100% Online Clearances</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-30 px-3 sm:px-6 py-2.5 sm:py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-lg sm:text-xl font-black text-[#002046] tracking-tight">BizClear</span>
                <span className="text-[9px] sm:text-[11px] bg-blue-100 text-blue-900 font-bold px-1.5 sm:px-2 py-0.5 rounded-full border border-blue-200">
                  MAHARASHTRA
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-500 font-medium truncate">
                Single-Window Factory Clearances, Document Locker & Subsidies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={() => setHelpOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-900 text-xs font-bold hover:bg-blue-100 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Help & Jargon Buster</span>
            </button>
            <Link to="/login">
              <Button variant="outline" size="sm" className="text-xs px-2.5 sm:px-3">Sign In</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="text-xs px-2.5 sm:px-3 font-bold">Register Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white via-slate-50 to-[#f8f9fc] border-b border-slate-200/80 py-10 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center space-y-5 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold shadow-2xs">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>Smart AI Assistance for Setting Up Factories & MSMEs in Maharashtra</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#002046] tracking-tight leading-tight">
            Start Your Business in Maharashtra <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-emerald-600">
              Without Visiting 10 Different Offices.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-3xl mx-auto leading-relaxed">
            BizClear replaces piles of paperwork and confusing government steps. Enter your business details once, upload your documents to a single secure locker, let Gemini AI map your required permissions (Pollution, Labour, Fire, Power), and track government guaranteed approval deadlines online.
          </p>

          {/* 1-Click Interactive Persona Sandbox Bar */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xl max-w-3xl mx-auto text-left space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-600" />
                Try Interactive Demo Instantly (1-Click Login):
              </span>
              <span className="text-[10px] sm:text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                ● Live Demo Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleQuickLogin('entrepreneur@demo.com')}
                className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/90 text-left transition-all group cursor-pointer shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs text-blue-950">1. Factory / MSME Owner</span>
                  <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  See how simple it is to upload documents once, get instant approvals checklist, and apply online.
                </p>
              </button>

              <button
                onClick={() => handleQuickLogin('officer@demo.com')}
                className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/90 text-left transition-all group cursor-pointer shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs text-emerald-950">2. Review Officer</span>
                  <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  See how officers review attached digital documents, ask queries, and grant approvals quickly.
                </p>
              </button>

              <button
                onClick={() => handleQuickLogin('admin@demo.com')}
                className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/90 text-left transition-all group cursor-pointer shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs text-purple-950">3. State Administrator</span>
                  <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Monitor statewide clearance speeds, department SLA compliance, and digital audit logs.
                </p>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works in 4 Simple Steps */}
      <section className="py-14 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Simple 4-Step Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002046]">
            How BizClear Works for First-Time Applicants
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Everything you need to know about getting your factory permissions approved effortlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: '1',
              title: 'Tell Us About Your Unit',
              desc: 'Enter basic details: your location (e.g. MIDC Chakan), industry sector, electricity load, and workers.',
              icon: Building2,
              color: 'text-blue-600 bg-blue-50 border-blue-200',
            },
            {
              step: '2',
              title: 'Upload Documents Once',
              desc: 'Upload your Land papers, Layout blueprint, and PAN into your private Document Locker. No repeated uploads.',
              icon: FileCheck2,
              color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
            },
            {
              step: '3',
              title: 'AI Generates Checklist',
              desc: 'Gemini AI automatically determines which NOCs you need (Pollution, Labour, Fire, Electricity) and checks for errors.',
              icon: Sparkles,
              color: 'text-purple-600 bg-purple-50 border-purple-200',
            },
            {
              step: '4',
              title: 'Submit & Track Timelines',
              desc: 'All applications are sent simultaneously to authorities. Track working-day countdowns guaranteed by the RTS Act.',
              icon: Clock,
              color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
            },
          ].map((card) => (
            <div
              key={card.step}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all space-y-3 relative"
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-slate-400 bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center">
                  {card.step}
                </span>
              </div>
              <h3 className="font-bold text-sm text-[#002046]">{card.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison: Old Way vs BizClear Single Window */}
      <section className="py-12 px-4 sm:px-6 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002046]">
              Why BizClear is Better & Faster
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              Compare the old traditional bureaucratic method with the modern BizClear experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Old Way */}
            <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-red-700 font-bold text-base border-b border-red-100 pb-2">
                <X className="w-5 h-5" />
                <span>The Old Traditional Way</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>Visit 7 different government departments across the city in person.</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>Fill repetitive 40-page application forms with identical documents.</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>Sequential delays: You wait for Department A before you can even apply to Department B.</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>Total time taken: <strong>6 to 12 months</strong> with zero visibility into status.</span>
                </li>
              </ul>
            </div>

            {/* The BizClear Single Window */}
            <div className="bg-white p-6 rounded-2xl border-2 border-emerald-400 shadow-md space-y-4 relative">
              <div className="absolute -top-3 right-4 bg-emerald-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                Recommended
              </div>
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-base border-b border-emerald-100 pb-2">
                <Check className="w-5 h-5 text-emerald-600" />
                <span>With BizClear Single Window</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-700 font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>100% Online:</strong> Zero physical office visits. Apply from your office or home.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Upload Once:</strong> Documents are automatically shared with MPCB, Labour, Fire, and Power.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Parallel Processing:</strong> All departments scrutinize your file simultaneously.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Total time: <strong>Under 30 to 45 Days</strong> with statutory guaranteed deadlines.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-[#00142e] text-slate-400 text-xs py-8 px-6 border-t border-blue-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-white font-bold">BizClear Maharashtra</span>
            <span>— Single Window Industrial Clearance & Incentive System</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <button onClick={() => setHelpOpen(true)} className="hover:text-white underline cursor-pointer">
              Terms Glossary & FAQ
            </button>
            <Link to="/login" className="hover:text-white underline">
              Demo Login
            </Link>
          </div>
        </div>
      </footer>

      <HelpGlossaryModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

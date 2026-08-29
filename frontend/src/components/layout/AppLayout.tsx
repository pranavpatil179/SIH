import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Toaster, toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { Bell, Menu, Shield, Sparkles, HelpCircle, Users, ChevronDown, Check } from 'lucide-react';
import { HelpGlossaryModal } from '../ui/HelpGlossaryModal';

export function AppLayout() {
  const { profile } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSwitchPersona = async (email: string) => {
    try {
      setPersonaMenuOpen(false);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: 'demo1234',
      });
      if (error) throw error;
      toast.success(`Switched role to ${email.split('@')[0]}`);
      if (email.includes('officer')) {
        navigate('/officer/dashboard');
      } else if (email.includes('admin')) {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error('Persona switch failed: ' + err.message);
    }
  };

  const roleName = profile?.role === 'officer' 
    ? 'Scrutiny Officer' 
    : profile?.role === 'admin' 
    ? 'State Admin' 
    : 'Business Applicant';

  return (
    <div className="flex h-screen bg-[#f8f9fc]">
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Institutional Government Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 z-20 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Logo / Desktop Title */}
            <div className="flex items-center gap-2">
              <Link to="/dashboard" className="lg:hidden flex items-center gap-1.5 font-bold text-[#002046] text-sm">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>BizClear</span>
                <span className="text-[9px] bg-blue-600 text-white font-mono px-1 rounded">MH</span>
              </Link>
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                <span>Government of Maharashtra Single Window Portal</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-700 font-semibold">BizClear OS</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Beginner Jargon Buster & Help Button */}
            <button
              onClick={() => setHelpOpen(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 text-blue-900 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer group"
              title="Click for simple definitions of government terms and FAQs"
            >
              <HelpCircle className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Jargon Buster & Guide</span>
              <span className="sm:hidden">Help</span>
            </button>

            {/* Persona Switcher Menu */}
            <div className="relative">
              <button
                onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                title="Switch persona for testing"
              >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>{roleName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {personaMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400">
                    Switch Test Persona
                  </div>
                  <button
                    onClick={() => handleSwitchPersona('entrepreneur@demo.com')}
                    className="w-full text-left p-2 rounded-lg text-xs font-medium hover:bg-blue-50 text-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-[#002046]">Industrial Applicant</p>
                      <p className="text-[10px] text-slate-500">MSME factory owner flow</p>
                    </div>
                    {profile?.role === 'entrepreneur' && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                  <button
                    onClick={() => handleSwitchPersona('officer@demo.com')}
                    className="w-full text-left p-2 rounded-lg text-xs font-medium hover:bg-emerald-50 text-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-[#002046]">Department Officer</p>
                      <p className="text-[10px] text-slate-500">Application review & queries</p>
                    </div>
                    {profile?.role === 'officer' && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                  <button
                    onClick={() => handleSwitchPersona('admin@demo.com')}
                    className="w-full text-left p-2 rounded-lg text-xs font-medium hover:bg-purple-50 text-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-[#002046]">Nodal Admin</p>
                      <p className="text-[10px] text-slate-500">State dashboard & SLA logs</p>
                    </div>
                    {profile?.role === 'admin' && <Check className="w-4 h-4 text-purple-600" />}
                  </button>
                </div>
              )}
            </div>

            {/* Notifications */}
            <Link
              to="/notifications"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </Link>

            <div className="h-4 w-[1px] bg-slate-200" />

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 text-xs">
              <div className="w-7 h-7 rounded-full bg-[#002046] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <span className="hidden lg:inline font-semibold text-slate-800">
                {profile?.full_name || 'User'}
              </span>
            </div>
          </div>
        </header>

        {/* Main Body View */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      <HelpGlossaryModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <Toaster richColors position="top-right" />
    </div>
  );
}

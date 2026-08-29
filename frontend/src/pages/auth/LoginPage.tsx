import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Building2, Shield, Lock, ArrowRight, Sparkles, User, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();

  const handleQuickSelect = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo1234');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Authenticated successfully');
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        toast.success('Account created! Please check your email to verify.');
        setMode('login');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00142e] via-[#002046] to-[#1b365d] flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="text-center mb-8 space-y-2">
        <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border border-white/20 shadow-2xl mb-2 hover:scale-105 transition-transform">
          <Shield className="w-8 h-8 text-white" />
        </Link>
        <h1 className="text-3xl font-black text-white tracking-tight">BizClear Maharashtra</h1>
        <p className="text-blue-200 text-xs font-medium">
          State Single Window Approval & Compliance Portal
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-8 w-full max-w-md space-y-6">
        {/* Toggle Mode */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white text-[#002046] shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white text-[#002046] shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Register Enterprise
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Rajesh Kumar"
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Official Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="entrepreneur@demo.com"
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Security Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
            />
          </div>

          <Button type="submit" loading={loading} className="w-full py-2.5 font-bold shadow-md text-sm" size="lg">
            {mode === 'login' ? 'Authenticate & Enter Portal' : 'Create Enterprise Account'}
          </Button>
        </form>

        {/* 1-Click Sandbox Credentials */}
        <div className="border-t border-slate-200 pt-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              ⚡ Instant 1-Click Demo Login:
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold">No password needed</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('entrepreneur@demo.com');
                setPassword('demo1234');
              }}
              className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-center transition-all cursor-pointer shadow-2xs group"
            >
              <Briefcase className="w-4 h-4 text-blue-700 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="block text-[11px] font-bold text-blue-950">Factory Owner</span>
              <span className="block text-[9px] text-slate-500 mt-0.5">MSME Applicant</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail('officer@demo.com');
                setPassword('demo1234');
              }}
              className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-center transition-all cursor-pointer shadow-2xs group"
            >
              <Building2 className="w-4 h-4 text-emerald-700 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="block text-[11px] font-bold text-emerald-950">Govt Officer</span>
              <span className="block text-[9px] text-slate-500 mt-0.5">Scrutiny Desk</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail('admin@demo.com');
                setPassword('demo1234');
              }}
              className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-center transition-all cursor-pointer shadow-2xs group"
            >
              <Shield className="w-4 h-4 text-purple-700 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="block text-[11px] font-bold text-purple-950">State Admin</span>
              <span className="block text-[9px] text-slate-500 mt-0.5">Nodal Console</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-blue-200/60">
        Maharashtra State Single Window Regulatory Framework • Integrated with Gemini AI
      </div>
    </div>
  );
}

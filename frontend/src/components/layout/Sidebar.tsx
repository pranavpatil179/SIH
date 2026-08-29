import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, Building2, ListChecks, FileText, ClipboardList,
  MessageSquare, Eye, ShieldCheck, Gift, Bell,
  Users, BarChart3, BookOpen, LogOut, ChevronRight, Shield, X, Scale
} from 'lucide-react';

const ENTREPRENEUR_NAV = [
  { section: 'YOUR FACTORY & SETUP' },
  { label: 'Overview & Status', subtitle: 'Live progress dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Business Profile', subtitle: 'Factory parameters & land', icon: Building2, to: '/business' },
  { label: 'Document Locker', subtitle: 'Upload once, reuse everywhere', icon: FileText, to: '/documents' },
  { section: 'APPROVALS & PERMISSIONS' },
  { label: 'AI Approval Roadmap', subtitle: 'Risk score & parallel tracks', icon: ListChecks, to: '/roadmap', badge: 'AI' },
  { label: 'Clearance Applications', subtitle: 'Track all statutory NOCs', icon: ClipboardList, to: '/applications' },
  { label: 'Department Queries', subtitle: 'Replies & officer messages', icon: MessageSquare, to: '/queries' },
  { label: 'Site Inspections', subtitle: 'Joint multi-agency visits', icon: Eye, to: '/inspections' },
  { section: 'SUBSIDIES & COMPLIANCE' },
  { label: 'Subsidies & Incentives', subtitle: 'State grants & PSI 2019', icon: Gift, to: '/schemes', badge: 'Eligible' },
  { label: 'Compliance & Renewals', subtitle: 'Annual statutory filings', icon: ShieldCheck, to: '/compliance' },
  { label: 'Formal Grievances', subtitle: 'RTS statutory appeals', icon: Scale, to: '/grievances', badge: 'RTS' },
  { label: 'Notifications & Alerts', subtitle: 'Status changes & notices', icon: Bell, to: '/notifications' },
];

const OFFICER_NAV = [
  { section: 'SCRUTINY DESK' },
  { label: 'Officer Dashboard', subtitle: 'Workload & metrics', icon: LayoutDashboard, to: '/officer/dashboard' },
  { label: 'Application Queue', subtitle: 'Risk-tiered dossiers', icon: ClipboardList, to: '/officer/applications' },
  { label: 'Queries & Clarifications', subtitle: 'Communicate with applicants', icon: MessageSquare, to: '/officer/queries' },
  { label: 'Joint Site Inspections', subtitle: 'Multi-department planner', icon: Eye, to: '/officer/inspections' },
  { section: 'TIMELINES & APPEALS' },
  { label: 'SLA Countdown Timers', subtitle: 'RTS statutory deadlines', icon: BarChart3, to: '/officer/sla' },
  { label: 'Appellate Grievances', subtitle: 'Escalated cases & orders', icon: Scale, to: '/officer/grievances' },
  { label: 'Throughput Analytics', subtitle: 'Disposal velocity', icon: BarChart3, to: '/officer/analytics' },
];

const ADMIN_NAV = [
  { section: 'STATE REGULATORY CONSOLE' },
  { label: 'State Overview', subtitle: 'Macro performance', icon: LayoutDashboard, to: '/admin/dashboard' },
  { label: 'Departments & Agencies', subtitle: 'MPCB, DISH, Fire, MSEDCL', icon: Building2, to: '/admin/departments' },
  { label: 'Clearance Registry', subtitle: 'Statutory approvals list', icon: ListChecks, to: '/admin/approvals' },
  { label: 'Subsidies & Policies', subtitle: 'Incentive frameworks', icon: Gift, to: '/admin/schemes' },
  { section: 'GOVERNANCE & APPEALS' },
  { label: 'Appellate Grievances', subtitle: 'RTS Section 18 orders', icon: Scale, to: '/admin/grievances', badge: '7d SLA' },
  { label: 'User & Role Access', subtitle: 'Officers and admins', icon: Users, to: '/admin/users' },
  { label: 'Statewide Analytics', subtitle: 'SLA compliance charts', icon: BarChart3, to: '/admin/analytics' },
  { label: 'Immutable Audit Trail', subtitle: 'Complete event log', icon: BookOpen, to: '/admin/audit' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { profile, signOut } = useAuthStore();
  const role = profile?.role || 'entrepreneur';
  const navItems = role === 'officer' ? OFFICER_NAV : role === 'admin' ? ADMIN_NAV : ENTREPRENEUR_NAV;
  
  const roleBadge = {
    entrepreneur: { bg: 'bg-blue-100 text-blue-900 border-blue-200', label: 'Industrial Applicant' },
    officer: { bg: 'bg-emerald-100 text-emerald-900 border-emerald-200', label: 'Department Scrutiny' },
    admin: { bg: 'bg-purple-100 text-purple-900 border-purple-200', label: 'Nodal Administrator' },
  }[role] || { bg: 'bg-slate-100 text-slate-800 border-slate-200', label: role };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#001833] text-slate-300 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#002855] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center shadow-md">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-white tracking-tight">BizClear</span>
              <span className="text-[10px] bg-blue-600 text-white font-mono px-1.5 py-0.2 rounded font-bold">MAHA</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Single Window Industrial Clearance</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role Pill */}
      <div className="px-4 py-3 border-b border-[#002855] bg-[#001329]/60">
        <div className="flex items-center justify-between">
          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded border', roleBadge.bg)}>
            {roleBadge.label}
          </span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        {profile && (
          <p className="text-xs font-semibold text-white mt-1.5 truncate">
            {profile.full_name}
          </p>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-2.5 space-y-1">
        {navItems.map((item: any, idx: number) => {
          if (item.section) {
            return (
              <p
                key={idx}
                className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider font-bold text-slate-400/90"
              >
                {item.section}
              </p>
            );
          }

          const isActive = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to + '/'));
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => {
                if (onClose) onClose();
              }}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-150 group',
                isActive
                  ? 'bg-blue-600 text-white shadow-md font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-white/6'
              )}
            >
              <item.icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-white' : 'text-slate-400 group-hover:text-white')} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      'text-[9px] px-1.5 py-0.2 rounded-full font-bold',
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </div>
                {item.subtitle && (
                  <p className={cn(
                    'text-[10px] truncate',
                    isActive ? 'text-blue-100 font-normal' : 'text-slate-400/80 group-hover:text-slate-300'
                  )}>
                    {item.subtitle}
                  </p>
                )}
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-[#002855] bg-[#001329]/90">
        <button
          onClick={() => {
            if (onClose) onClose();
            signOut();
          }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out Session</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#001833] border-r border-[#002855] flex-col h-screen sticky top-0 shadow-xl z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer & Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onClose}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

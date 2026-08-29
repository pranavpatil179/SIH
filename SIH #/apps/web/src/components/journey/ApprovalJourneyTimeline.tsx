import { CheckCircle, Clock, AlertTriangle, XCircle, ChevronRight, MessageSquare, Search, FileCheck, Award, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface TimelineStep {
  id: string
  label: string
  status: 'completed' | 'active' | 'pending' | 'warning' | 'error' | 'blocked'
  description?: string
  count?: { current?: number; total?: number }
  badge?: string
  href?: string
  subItems?: Array<{
    label: string
    status: 'completed' | 'active' | 'pending' | 'warning' | 'error'
    department?: string
    badge?: string
  }>
}

interface ApprovalJourneyTimelineProps {
  projectId?: string
  applicationId?: string
  steps?: TimelineStep[]
  compact?: boolean
}

const statusConfig = {
  completed: {
    icon: CheckCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Completed'
  },
  active: {
    icon: Clock,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    dot: 'bg-blue-500',
    label: 'In Progress'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    dot: 'bg-amber-500',
    label: 'Needs Attention'
  },
  error: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-500',
    label: 'Issue'
  },
  pending: {
    icon: Clock,
    color: 'text-slate-400',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    dot: 'bg-slate-300',
    label: 'Pending'
  },
  blocked: {
    icon: Shield,
    color: 'text-slate-400',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    dot: 'bg-slate-200',
    label: 'Blocked'
  },
}

const subStatusIcons = {
  completed: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />,
  active: <Clock className="h-3.5 w-3.5 text-blue-500" />,
  warning: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
  error: <XCircle className="h-3.5 w-3.5 text-red-500" />,
  pending: <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300" />,
}

export function ApprovalJourneyTimeline({ steps, compact = false, projectId, applicationId }: ApprovalJourneyTimelineProps) {
  const navigate = useNavigate()

  const defaultSteps: TimelineStep[] = [
    { id: 'profile', label: 'Business Profile', status: 'pending', description: 'Company & owner details', href: '/profile' },
    { id: 'project', label: 'Project Details', status: 'pending', description: 'Location, investment, scale', href: `/projects/new` },
    { id: 'intelligence', label: 'Approval Intelligence', status: 'pending', description: 'Regulatory engine analysis', href: projectId ? `/projects/${projectId}/approval-intelligence` : undefined },
    { id: 'checklist', label: 'Approval Checklist', status: 'pending', description: 'All required approvals identified', href: projectId ? `/projects/${projectId}/checklist` : undefined },
    { id: 'documents', label: 'Document Center', status: 'pending', description: 'Upload & verify documents', href: projectId ? `/projects/${projectId}/documents` : undefined },
    { id: 'validation', label: 'Pre-validation', status: 'pending', description: 'Document completeness check', href: projectId ? `/projects/${projectId}/pre-validation` : undefined },
    { id: 'submit', label: 'Application Submitted', status: 'pending', description: 'Forwarded to departments' },
    {
      id: 'scrutiny', label: 'Department Scrutiny', status: 'pending', description: 'Parallel review by departments',
      subItems: [
        { label: 'Environment Dept.', status: 'pending', department: 'MPCB' },
        { label: 'Factory Dept.', status: 'pending', department: 'Labour' },
        { label: 'Fire Dept.', status: 'pending', department: 'Fire' },
      ]
    },
    { id: 'inspection', label: 'Inspection', status: 'pending', description: 'Site inspection (if required)', href: applicationId ? `/applications/${applicationId}/inspection` : undefined },
    { id: 'decision', label: 'Decision', status: 'pending', description: 'Approval or rejection' },
    { id: 'compliance', label: 'Compliance Tracking', status: 'pending', description: 'Ongoing obligations', href: projectId ? `/projects/${projectId}/compliance` : undefined },
    { id: 'renewals', label: 'Renewals & Incentives', status: 'pending', description: 'Renewal alerts & scheme tracking', href: projectId ? `/projects/${projectId}/renewals` : undefined },
  ]

  const displaySteps = steps || defaultSteps

  if (compact) {
    const completedCount = displaySteps.filter(s => s.status === 'completed').length
    const activeStep = displaySteps.find(s => s.status === 'active' || s.status === 'warning')
    return (
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Journey Progress</span>
            <span>{completedCount}/{displaySteps.length} steps</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / displaySteps.length) * 100}%` }}
            />
          </div>
        </div>
        {activeStep && (
          <div className="text-xs text-blue-600 font-medium whitespace-nowrap">
            {activeStep.label}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {displaySteps.map((step, idx) => {
        const config = statusConfig[step.status]
        const Icon = config.icon

        return (
          <div key={step.id} className="relative">
            {/* Connector line */}
            {idx < displaySteps.length - 1 && (
              <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-slate-200 z-0" />
            )}

            <div
              className={`relative z-10 flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 ${config.border} ${config.bg}
                ${step.href ? 'cursor-pointer hover:shadow-sm hover:scale-[1.01]' : ''}`}
              onClick={() => step.href && navigate(step.href)}
            >
              {/* Status dot / icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                step.status === 'completed' ? 'bg-emerald-100' :
                step.status === 'active' ? 'bg-blue-100' :
                step.status === 'warning' ? 'bg-amber-100' :
                step.status === 'error' ? 'bg-red-100' : 'bg-slate-100'
              }`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-semibold ${step.status === 'pending' || step.status === 'blocked' ? 'text-slate-400' : 'text-slate-800'}`}>
                    {step.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {step.count && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        step.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        step.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {step.count.current}/{step.count.total}
                      </span>
                    )}
                    {step.badge && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        step.badge === 'ACTION REQUIRED' ? 'bg-red-100 text-red-700 animate-pulse' :
                        step.badge === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {step.badge}
                      </span>
                    )}
                    {step.href && <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                  </div>
                </div>
                {step.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                )}

                {/* Sub-items for parallel departments */}
                {step.subItems && step.subItems.length > 0 && (
                  <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-slate-200">
                    {step.subItems.map((sub, subIdx) => (
                      <div key={subIdx} className="flex items-center gap-2">
                        {subStatusIcons[sub.status]}
                        <span className="text-xs text-slate-600">{sub.label}</span>
                        {sub.department && (
                          <span className="text-xs text-slate-400">({sub.department})</span>
                        )}
                        {sub.badge && (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            {sub.badge}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

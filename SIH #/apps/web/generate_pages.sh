#!/bin/bash

# Public
mkdir -p src/pages/public
for p in Landing HowItWorks Login Register; do
  echo "export default function $p() { return <div className='p-8'><h1 className='text-2xl font-bold'>$p</h1></div> }" > src/pages/$p.tsx
done

# Applicant
mkdir -p src/pages/applicant
for p in Dashboard BusinessProfile CreateProject ApprovalIntelligence ApprovalChecklist DependencyGraph DocumentCenter PreValidation VerifiedDataPassport ApplicationDetails Queries InspectionSchedule SLATracker Compliance Renewals Schemes Incentives Notifications Grievances; do
  echo "export default function $p() { return <div className='p-8'><h1 className='text-2xl font-bold'>$p</h1></div> }" > src/pages/applicant/$p.tsx
done

# Officer
mkdir -p src/pages/officer
for p in OfficerDashboard ApplicationQueue ApplicationReview DocumentReview QueryManagement RiskAssessment InspectionPlanner SLAMonitor; do
  echo "export default function $p() { return <div className='p-8'><h1 className='text-2xl font-bold'>$p</h1></div> }" > src/pages/officer/$p.tsx
done

# Admin
mkdir -p src/pages/admin
for p in RegulatoryRules Connectors AuditLogs Analytics; do
  echo "export default function $p() { return <div className='p-8'><h1 className='text-2xl font-bold'>$p</h1></div> }" > src/pages/admin/$p.tsx
done

# Components
mkdir -p src/components/ui src/components/layout src/components/journey src/components/graph src/components/approvals src/components/documents src/components/risk
echo "export const DataSourceBadge = ({ type }: { type: string }) => <span className={'badge-' + type.toLowerCase()}>{type}</span>" > src/components/ui/DataSourceBadge.tsx
echo "export const StatusBadge = ({ status }: { status: string }) => <span className='badge-live'>{status}</span>" > src/components/ui/StatusBadge.tsx
echo "export const SLABar = () => <div>SLA Bar</div>" > src/components/ui/SLABar.tsx
echo "export const LoadingSpinner = () => <div>Loading...</div>" > src/components/ui/LoadingSpinner.tsx
echo "export const EmptyState = () => <div>No Data</div>" > src/components/ui/EmptyState.tsx
echo "export const ErrorState = () => <div>Error</div>" > src/components/ui/ErrorState.tsx

echo "import { Outlet } from 'react-router-dom'; export const AppLayout = () => <div><Outlet /></div>" > src/components/layout/AppLayout.tsx
echo "export const Sidebar = () => <div>Sidebar</div>" > src/components/layout/Sidebar.tsx
echo "export const NotificationBell = () => <div>🔔</div>" > src/components/layout/NotificationBell.tsx

echo "export const ApprovalJourneyTimeline = () => <div>Timeline</div>" > src/components/journey/ApprovalJourneyTimeline.tsx
echo "export const DependencyGraph = () => <div>Graph</div>" > src/components/graph/DependencyGraph.tsx
echo "export const ApprovalCard = () => <div>Card</div>" > src/components/approvals/ApprovalCard.tsx
echo "export const DocumentCard = () => <div>Doc</div>" > src/components/documents/DocumentCard.tsx
echo "export const RiskScoreBreakdown = () => <div>Risk</div>" > src/components/risk/RiskScoreBreakdown.tsx

mkdir -p src/hooks src/store src/types src/lib


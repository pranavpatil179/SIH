import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Users, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([
    { id: '1', full_name: 'Rajesh Kumar (Demo Entrepreneur)', email: 'entrepreneur@demo.com', role: 'entrepreneur' },
    { id: '2', full_name: 'S. Kumar - MPCB Officer', email: 'officer@demo.com', role: 'officer', dept: 'Maharashtra Pollution Control Board' },
    { id: '3', full_name: 'R. Mehta - Labour Officer', email: 'labour@demo.com', role: 'officer', dept: 'Maharashtra Labour Department' },
    { id: '4', full_name: 'Nodal Administrator', email: 'admin@demo.com', role: 'admin' },
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="User & Role-Based Access Control Console"
        subtitle="Manage department officer assignments, applicant credentials, and system administration privileges"
      />

      <div className="bg-white border rounded-lg divide-y">
        {users.map((u) => (
          <div key={u.id} className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-foreground">{u.full_name}</h4>
                <Badge variant={u.role === 'admin' ? 'danger' : u.role === 'officer' ? 'info' : 'success'}>
                  {u.role.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{u.email}</p>
              {u.dept && <p className="text-xs text-primary-800 font-medium">{u.dept}</p>}
            </div>
            <span className="text-xs text-green-600 font-medium">Active</span>
          </div>
        ))}
      </div>
    </div>
  );
}

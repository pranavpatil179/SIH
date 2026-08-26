"use client";

import { useTransition } from "react";
import { loginAsDepartmentOfficer } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Building2 } from "lucide-react";
import type { Department } from "@/lib/types";

export function DepartmentGrid({ departments }: { departments: Department[] }) {
  const [isPending, startTransition] = useTransition();

  function handleLogin(id: string) {
    startTransition(async () => {
      try {
        await loginAsDepartmentOfficer(id);
      } catch (err: any) {
        alert(err.message);
      }
    });
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {departments.map((dept) => (
        <Card key={dept.id} className="transition-all hover:shadow-md hover:ring-1 hover:ring-brand-200">
          <CardContent className="flex h-full flex-col p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
              <Building2 className="h-6 w-6" />
            </div>
            
            <h2 className="mb-2 text-lg font-semibold text-slate-900 leading-tight">
              {dept.name}
            </h2>
            <p className="mb-6 text-sm text-slate-500">
              Handles {dept.id.toUpperCase()} approvals and document verification.
            </p>
            
            <div className="mt-auto">
              <Button 
                onClick={() => handleLogin(dept.id)} 
                disabled={isPending}
                className="w-full bg-brand-50 text-brand-700 hover:bg-brand-100 ring-1 ring-brand-200"
                variant="secondary"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Enter {dept.id.toUpperCase()} Portal
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

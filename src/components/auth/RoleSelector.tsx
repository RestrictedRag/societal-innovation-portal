'use client';

import { BriefcaseBusiness, GraduationCap, ShieldCheck, UserRound } from 'lucide-react';

import { cn } from '@/lib/utils';
import { userRoleEnum } from '@/lib/validations/auth';

export type RoleOption = (typeof userRoleEnum)[number];

const roleMeta: Record<RoleOption, { label: string; description: string; icon: typeof UserRound }> = {
  CITIZEN: { label: 'Citizen', description: 'Report issues and engage with the community', icon: UserRound },
  STUDENT: { label: 'Student', description: 'Join research and innovation opportunities', icon: GraduationCap },
  FACULTY: { label: 'Faculty', description: 'Lead academic projects and mentorship', icon: ShieldCheck },
  COMPANY_REP: { label: 'Company', description: 'Support pilots and funding opportunities', icon: BriefcaseBusiness },
};

interface RoleSelectorProps {
  value: RoleOption;
  onChange: (role: RoleOption) => void;
  error?: string;
}

export function RoleSelector({ value, onChange, error }: RoleSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-200">Select your role</label>
      <div className="grid gap-2 sm:grid-cols-2">
        {userRoleEnum.map((role) => {
          const meta = roleMeta[role];
          const Icon = meta.icon;
          const selected = value === role;

          return (
            <button
              key={role}
              type="button"
              onClick={() => onChange(role)}
              className={cn(
                'flex items-start gap-3 rounded-xl border p-3 text-left transition',
                selected
                  ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]'
                  : 'border-slate-700 bg-slate-950/60 hover:border-slate-500'
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border',
                  selected ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300' : 'border-slate-700 bg-slate-900 text-slate-300'
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-100">{meta.label}</span>
                <span className="mt-1 block text-xs text-slate-400">{meta.description}</span>
              </span>
            </button>
          );
        })}
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

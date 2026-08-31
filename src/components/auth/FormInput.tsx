'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '@/lib/utils';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export function FormInput({
  label,
  error,
  helperText,
  type = 'text',
  className,
  id,
  ...props
}: FormInputProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  const resolvedType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={resolvedType}
          className={cn(
            'flex h-11 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            type === 'password' && 'pr-10',
            className
          )}
          {...props}
        />
        {type === 'password' && (
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((current) => !current)}
            className="absolute inset-y-0 right-3 flex items-center text-muted transition hover:text-ink"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {helperText && !error ? <p className="text-xs text-muted">{helperText}</p> : null}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

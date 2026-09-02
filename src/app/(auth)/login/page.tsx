'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { AuthCardWrapper } from '@/components/auth/AuthCardWrapper';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { FormInput } from '@/components/auth/FormInput';
import { loginSchema, type LoginValues } from '@/lib/validations/auth';

import { useAuth } from '@/lib/auth/use-auth';

export default function LoginPage() {
  const router = useRouter();
  const { refetch } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      setFormError(null);

      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setFormError(error.message || 'Invalid email or password.');
        return;
      }

      await refetch();
      router.push('/feed');
      router.refresh();
    } catch (err) {
      console.error('Login error:', err);
      setFormError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    }
  };

  const handleQuickFill = (email: string) => {
    setValue('email', email);
    setValue('password', 'password123');
  };

  return (
    <AuthCardWrapper
      headerLabel="Welcome back"
      title="Log in to your account"
      subtitle="Access your civic dashboard, projects, and opportunities."
      footerText="Need an account?"
      footerLink="Sign up"
      footerHref="/signup"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {formError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {formError}
          </div>
        ) : null}

        <FormInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <FormInput
          label="Password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <AuthSubmitButton isLoading={isSubmitting} loadingText="Signing in..." text="Sign in" />

        {/* Demo Fast Login Selector */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
            Demo Test Accounts
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickFill('prathviraj494@gmail.com')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition text-left truncate"
            >
              👤 Citizen
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('student.valid.1788197151905@example.com')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition text-left truncate"
            >
              🎓 Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('test.faculty.1788288322979@example.com')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition text-left truncate"
            >
              🏛️ Faculty
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('demo_admin@example.com')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition text-left truncate"
            >
              🛡️ Admin
            </button>
          </div>
        </div>
      </form>
    </AuthCardWrapper>
  );
}


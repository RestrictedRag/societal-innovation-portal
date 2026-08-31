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

export default function LoginPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
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

      router.push('/feed');
    } catch (err) {
      console.error('Login error:', err);
      setFormError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    }
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
      </form>
    </AuthCardWrapper>
  );
}


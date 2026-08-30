'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { AuthCardWrapper } from '@/components/auth/AuthCardWrapper';
import { FormInput } from '@/components/auth/FormInput';
import { LocationDetector } from '@/components/auth/LocationDetector';
import { RoleSelector } from '@/components/auth/RoleSelector';
import { signUpSchema, type SignUpValues } from '@/lib/validations/auth';

const defaultValues: SignUpValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'CITIZEN',
  city: '',
  state: '',
  latitude: null,
  longitude: null,
};

export default function SignUpPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues,
  });

  const role = watch('role');
  const city = watch('city');
  const state = watch('state');
  const latitude = watch('latitude');
  const longitude = watch('longitude');

  const onSubmit = async (values: SignUpValues) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({ message: 'Registration failed.' }))) as {
        message?: string;
      };
      throw new Error(payload.message ?? 'Registration failed.');
    }

    router.push('/login');
  };

  return (
    <AuthCardWrapper
      headerLabel="Create account"
      title="Join the civic platform"
      subtitle="Set up your profile to report issues, collaborate, and access local opportunities."
      footerText="Already have an account?"
      footerLink="Log in"
      footerHref="/login"
      roleBadge={role}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="First name"
            placeholder="Jane"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <FormInput
            label="Last name"
            placeholder="Doe"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

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
          placeholder="Enter a strong password"
          autoComplete="new-password"
          error={errors.password?.message}
          helperText="Min 8 characters with one uppercase letter and one number."
          {...register('password')}
        />

        <RoleSelector
          value={role}
          onChange={(nextRole) => setValue('role', nextRole, { shouldValidate: true, shouldDirty: true })}
          error={errors.role?.message}
        />

        <LocationDetector
          city={city}
          state={state}
          latitude={latitude}
          longitude={longitude}
          onCityChange={(value) => setValue('city', value, { shouldValidate: true, shouldDirty: true })}
          onStateChange={(value) => setValue('state', value, { shouldValidate: true, shouldDirty: true })}
          onCoordinatesChange={(coords) => {
            setValue('latitude', coords?.latitude ?? null, { shouldValidate: true, shouldDirty: true });
            setValue('longitude', coords?.longitude ?? null, { shouldValidate: true, shouldDirty: true });
          }}
          error={errors.city?.message || errors.state?.message}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthCardWrapper>
  );
}

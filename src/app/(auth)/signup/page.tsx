'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { AuthCardWrapper } from '@/components/auth/AuthCardWrapper';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { FormInput } from '@/components/auth/FormInput';
import { LocationInput } from '@/components/auth/LocationInput';
import { RoleSelector } from '@/components/auth/RoleSelector';
import { UniversitySelector } from '@/components/auth/UniversitySelector';
import { signUpSchema, type SignUpValues } from '@/lib/validations/auth';

const defaultValues: SignUpValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'CITIZEN',
  universityId: null,
  city: '',
  state: '',
  formattedAddress: '',
  country: '',
  latitude: null,
  longitude: null,
};

export default function SignUpPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
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
  const universityId = watch('universityId');
  const city = watch('city');
  const state = watch('state');

  const onSubmit = async (values: SignUpValues) => {
    try {
      setFormError(null);

      const { error: signUpError } = await authClient.signUp.email({
        email: values.email,
        password: values.password,
        name: `${values.firstName} ${values.lastName}`,
      });

      if (signUpError) {
        setFormError(signUpError.message || 'Failed to create account.');
        return;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          role: values.role,
          universityId: values.role === 'STUDENT' || values.role === 'FACULTY' ? values.universityId : null,
          city: values.city,
          state: values.state,
          formattedAddress: values.formattedAddress,
          country: values.country,
          latitude: values.latitude,
          longitude: values.longitude,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({ message: 'Profile setup failed.' }))) as {
          message?: string;
        };
        setFormError(payload.message ?? 'Profile setup failed.');
        return;
      }

      router.push('/feed');
    } catch (err) {
      console.error('Signup error:', err);
      setFormError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    }
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
        {formError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {formError}
          </div>
        ) : null}

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
          onChange={(nextRole) => {
            setValue('role', nextRole, { shouldValidate: true, shouldDirty: true });
            if (nextRole === 'CITIZEN' || nextRole === 'COMPANY_REP') {
              setValue('universityId', null, { shouldValidate: true });
            }
          }}
          error={errors.role?.message}
        />

        {role === 'STUDENT' || role === 'FACULTY' ? (
          <UniversitySelector
            value={universityId}
            onChange={(nextUniId) =>
              setValue('universityId', nextUniId, { shouldValidate: true, shouldDirty: true })
            }
            error={errors.universityId?.message}
            label={role === 'STUDENT' ? 'Student University / College' : 'Faculty Affiliation'}
          />
        ) : null}

        <LocationInput
          value={[city, state].filter(Boolean).join(', ')}
          onLocationClear={() => {
            setValue('city', '', { shouldValidate: true, shouldDirty: true });
            setValue('state', '', { shouldValidate: true, shouldDirty: true });
            setValue('formattedAddress', '', { shouldValidate: true, shouldDirty: true });
            setValue('country', '', { shouldValidate: true, shouldDirty: true });
            setValue('latitude', null, { shouldValidate: true, shouldDirty: true });
            setValue('longitude', null, { shouldValidate: true, shouldDirty: true });
          }}
          onLocationSelect={(location) => {
            setValue('city', location.city, { shouldValidate: true, shouldDirty: true });
            setValue('state', location.state, { shouldValidate: true, shouldDirty: true });
            setValue('formattedAddress', location.formattedAddress, { shouldValidate: true, shouldDirty: true });
            setValue('country', location.country, { shouldValidate: true, shouldDirty: true });
            setValue('latitude', location.latitude, { shouldValidate: true, shouldDirty: true });
            setValue('longitude', location.longitude, { shouldValidate: true, shouldDirty: true });
          }}
          error={errors.city?.message || errors.state?.message}
        />

        <AuthSubmitButton
          isLoading={isSubmitting}
          loadingText="Creating account..."
          text="Create account"
        />
      </form>
    </AuthCardWrapper>
  );
}

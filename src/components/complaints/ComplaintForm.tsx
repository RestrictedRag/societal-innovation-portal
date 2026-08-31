'use client';

import type { ComplaintFormProps } from './useComplaintForm';
import { useComplaintForm } from './useComplaintForm';
import { ComplaintFormView } from './ComplaintFormView';

export type { ComplaintFormProps } from './useComplaintForm';

export function ComplaintForm(props: ComplaintFormProps) {
  const form = useComplaintForm(props);

  return <ComplaintFormView {...form} onClose={props.onClose} />;
}

import { type FieldValues } from 'react-hook-form';
import { type ValidUserCreationFormData } from '@workwise/components/views';
import { isNullOrUndefined } from '@workwise/utilities';

import { type User } from './user';

export type Laborer = User & { type: 'laborer' };

export const validUserCreationFormData = (data: FieldValues): data is ValidUserCreationFormData => {
  return !isNullOrUndefined((data as ValidUserCreationFormData).name) &&
    !isNullOrUndefined((data as ValidUserCreationFormData).userType);
};

export interface Credentials {
  accessToken: string;
  idToken: string;
}

export * from './user';

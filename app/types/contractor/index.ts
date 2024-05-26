import type { Associated } from '@workwise/types';

export interface Contractor {
  laborers?: Associated[];
  projects?: Associated[];
  admins?: Associated[];
  carpenters?: Associated[];
  personnel?: Associated[];
  subContractors?: Associated[];
  loginEnabled: boolean;
  address: string;
  email: string;
  name: string;
  phoneNumber: string | number;
  uuid: string;
  id: number;
}

export type ContractorInfo = Pick<Contractor, 'address' | 'email' | 'name'>;

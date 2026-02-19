import { type Address, type AddressAttributes } from '../api/interfaces';
import { type Client } from '../client';

export interface ProjectFormFields {
  name: string;
  addresses: AddressAttributes[];
  client: Client;
}

export interface ProjectForm {
  project: Pick<Project, 'name' | 'addresses' | 'client' | 'description'> & { address: Address };
}

export interface Project {
  id: number;
  name: string;
  description: string;
  addresses: Address[];
  carpenters: string[];
  laborers: string[];
  sub_contractors: string[];
  created_at?: string;
  updated_at?: string;
  client?: Client;
}

export const isProject = (obj: any): obj is Project => (
  obj.name !== undefined && obj.client !== undefined && obj.id !== undefined
);

export type ProjectProps = Pick<Project, 'id' | 'name'> & {
  status: 'pending' | 'under contract',
  address: string;
  data: [];
};

export * from '../bids';
export * from './create_project_form';
export * from './materials';

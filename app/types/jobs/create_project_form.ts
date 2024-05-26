import { type Client } from '../client';

export interface Project {
  title: string;
  client: Client;
  address: string;
  users: string[];
  materials: string[];
}

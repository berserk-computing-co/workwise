import { type UserResponse } from './api/interfaces';

type ClientFields = 'id' | 'uuid' | 'email' | 'phoneNumber' | 'firstName' | 'lastName';
export type Client = Pick<UserResponse, ClientFields>;

export const isClient = (obj: any): obj is Client | Partial<Client> => (
  (obj as Client).firstName !== undefined &&
  (obj as Client).email !== undefined &&
  (obj as Client).id !== undefined
);

import { type Associated } from '@workwise/types/api/interfaces';

import { type UserType } from '.';

export interface User {
  uuid: string;
  id: string;
  address: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: number;
  type: UserType;
  projects?: Associated[]

  // allow room for other random properties we don't care about.
  [key: string]: any;
}

export interface CustomUser extends User {
  title: string;
}

export interface Admin extends User {
  authUserId: string;
}

export const isCustomUser = (user: User): user is CustomUser => (
  (user as CustomUser).title !== undefined
);

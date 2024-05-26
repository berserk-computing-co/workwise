import { type Contact } from '../client';

import { type UserResponse } from './interfaces';

export const asContact = (userResponse: Partial<UserResponse>): Contact | undefined => {
  const { firstName, lastName, email, phoneNumber } = userResponse;
  if (firstName && lastName && email && phoneNumber) {
    return {
      name: firstName + ' ' + lastName,
      email,
      phone: phoneNumber
    };
  }
};

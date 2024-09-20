'use client'

import { StytchProvider } from "@stytch/nextjs";
import { createStytchUIClient } from "@stytch/nextjs/ui";


const stytch = createStytchUIClient(
  process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN ?? ''
);

export const AuthProvider = ({ children }) => (
  <StytchProvider stytch={stytch}>{children}</StytchProvider>
);
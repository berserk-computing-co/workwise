"use client";

import { useUser } from "@auth0/nextjs-auth0/client";

const DEV_USER = {
  sub: "dev|local",
  name: "Dev User",
  email: "dev@local.test",
};

export function useAppUser() {
  const auth0 = useUser();
  if (process.env.NEXT_PUBLIC_DEV_SKIP_AUTH === "true") {
    return { user: DEV_USER, isLoading: false };
  }
  return auth0;
}

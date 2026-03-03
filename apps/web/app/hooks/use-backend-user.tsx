"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAppUser } from "./use-app-user";
import type { User, Organization } from "@/app/types/project-api";

interface UserState {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  needsOnboarding: boolean;
  refetch: () => void;
}

const UserContext = createContext<UserState>({
  user: null,
  organization: null,
  isLoading: true,
  needsOnboarding: false,
  refetch: () => {},
});

export function useUserContext() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user: auth0User, isLoading: authLoading } = useAppUser();
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchUser = useCallback(async () => {
    if (!auth0User) {
      setUser(null);
      setOrganization(null);
      setNeedsOnboarding(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/proxy/users/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setNeedsOnboarding(false);

        const orgRes = await fetch("/api/proxy/organizations/me");
        if (orgRes.ok) {
          setOrganization(await orgRes.json());
        }
      } else {
        setNeedsOnboarding(true);
      }
    } catch {
      setNeedsOnboarding(true);
    } finally {
      setIsLoading(false);
    }
  }, [auth0User]);

  useEffect(() => {
    if (!authLoading) {
      fetchUser();
    }
  }, [authLoading, fetchUser]);

  return (
    <UserContext.Provider
      value={{
        user,
        organization,
        isLoading: authLoading || isLoading,
        needsOnboarding,
        refetch: fetchUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

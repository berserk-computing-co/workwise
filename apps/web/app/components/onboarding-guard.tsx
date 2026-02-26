"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserContext } from "@/app/hooks/use-backend-user";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, needsOnboarding } = useUserContext();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && needsOnboarding && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [isLoading, needsOnboarding, pathname, router]);

  if (isLoading) return null;
  if (needsOnboarding && pathname !== "/onboarding") return null;

  return <>{children}</>;
}

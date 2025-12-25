"use client";

import { useSession } from "@/hooks/useAuth";
import { useRoleView } from "@/shared/hooks/useRoleView";

/**
 * Convenience wrapper around `useRoleView` that automatically reads `userRoles`
 * from the authenticated session.
 */
export function useActiveRoleView() {
  const { data: session } = useSession();
  const userRoles = session?.user?.roles || ["client"];
  return {
    userRoles,
    ...useRoleView({ userRoles }),
  };
}



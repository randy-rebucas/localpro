"use client";

import { UserProfile } from "@/components/user-profile";
import { useSession } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're sure the session is not loading and user is not authenticated
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  // Show loading state while session is being checked
  if (status === "loading") {
    return null; // Let the loading.tsx file handle the loading state
  }

  // Show loading state if no session (but don't redirect immediately)
  if (!session) {
    return null; // Let the loading.tsx file handle the loading state
  }

  return <UserProfile />;
}

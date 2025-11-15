"use client";

import { Session } from "@/hooks/useAuth";
import { getUserName } from "@/lib/utils/user-name";

export function getMarketplaceGreeting(
  session: Session | null | undefined,
  isClientView: boolean,
  isProviderView: boolean
): { greeting: string; description: string } {
  const userName = getUserName(session);

  const greeting = isClientView
    ? `Hi ${userName}, find a provider today?`
    : isProviderView
    ? `Hi ${userName}, welcome to your job marketplace`
    : `Hi ${userName}, welcome to the marketplace`;

  const description = isClientView
    ? "Discover and connect with trusted service providers in your area"
    : isProviderView
    ? "Browse and discover job opportunities, or manage your job postings"
    : "Browse providers and manage your listings";

  return { greeting, description };
}


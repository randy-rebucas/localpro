import { Session } from "@/hooks/useAuth";

export function getUserName(session: Session | null | undefined): string {
  if (session?.user?.firstName) {
    return session.user.firstName;
  }
  if (session?.user?.name) {
    return session.user.name.split(" ")[0];
  }
  return "there";
}


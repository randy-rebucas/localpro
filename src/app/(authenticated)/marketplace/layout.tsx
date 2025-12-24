"use client";

import { Broadcaster } from "@/components/broadcaster";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Users } from "lucide-react";
import { Briefcase } from "lucide-react";
import { BarChart3 } from "lucide-react";
import { Calendar } from "lucide-react";
import { FileText } from "lucide-react";
import { Headphones } from "lucide-react";
import { useSession } from "@/hooks/useAuth";
import { useRoleView } from "@/hooks/useRoleView";
import { useMemo } from "react";

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const userRoles = useMemo(() => session?.user?.roles || [], [session?.user?.roles]);
  const { isProviderView } = useRoleView({ userRoles });

  return <>{children}</>;
}

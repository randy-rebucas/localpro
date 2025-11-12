import { Metadata } from "next";
import { ReactNode } from "react";
import { generateMetadata as genMeta } from "@/lib/metadata";

export const metadata: Metadata = genMeta({
  title: "Supplies & Materials",
  description: "Find and order professional supplies and equipment from verified suppliers.",
  keywords: ["supplies", "materials", "equipment", "tools", "ordering"],
});

interface SuppliesLayoutProps {
  children: ReactNode;
}

export default function SuppliesLayout({ children }: SuppliesLayoutProps) {
  return children;
}

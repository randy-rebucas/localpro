import { Metadata } from "next";
import { ReactNode } from "react";
import { generateMetadata as genMeta } from "@/lib/metadata";

export const metadata: Metadata = genMeta({
  title: "Rentals",
  description: "Rent professional equipment and vehicles for your projects and business needs.",
  keywords: ["rentals", "equipment", "vehicles", "tools", "rent"],
});

interface RentalsLayoutProps {
  children: ReactNode;
}

export default function RentalsLayout({ children }: RentalsLayoutProps) {
  return children;
}

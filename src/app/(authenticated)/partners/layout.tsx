import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partners - LocalPro",
  description: "Manage your partnership with LocalPro. Access partner resources, analytics, and collaboration tools.",
};

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


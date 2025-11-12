import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agency Management - LocalPro",
  description: "Manage your agency, providers, and analytics. Access agency-specific tools and resources.",
};

export default function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ads - LocalPro",
  description: "Manage your advertising campaigns and reach your target audience",
};

export default function AdsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

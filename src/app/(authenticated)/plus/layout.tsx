import { Metadata } from "next";
import { generateMetadata as genMeta } from "@/lib/metadata";

export const metadata: Metadata = genMeta({
  title: "LocalPro Plus",
  description: "Premium tier subscription service with exclusive benefits for providers and clients.",
  keywords: ["plus", "premium", "subscription", "providers", "clients"],
});

export default function PlusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      {children}
    </div>
  );
}

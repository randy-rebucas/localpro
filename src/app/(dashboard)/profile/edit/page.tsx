"use client";

import { useEffect, useState } from "react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { EditProfileForm } from "@/components/edit-profile-form";

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function EditProfilePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs
        className="text-sm text-gray-500 mb-4"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Profile", href: "/profile" },
          { label: "Edit" },
        ]}
      />

      <EditProfileForm />
    </div>
  );
}



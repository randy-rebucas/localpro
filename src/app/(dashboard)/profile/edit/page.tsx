"use client";

import Breadcrumbs from "@/components/ui/breadcrumbs";
import { EditProfileForm } from "@/components/edit-profile-form";

export default function EditProfilePage() {
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



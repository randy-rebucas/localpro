"use client";

import Breadcrumbs from "@/components/ui/breadcrumbs";
import { UserProfile } from "@/components/user-profile";

export default function ProfilePage() {
  return (
    <div>
      <Breadcrumbs
        className="text-sm text-gray-500 mb-4"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Profile" },
        ]}
      />

      <UserProfile />
    </div>
  );
}



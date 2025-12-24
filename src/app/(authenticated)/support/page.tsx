"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SupportPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to public support page
    router.push("/support");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to support...</p>
      </div>
    </div>
  );
}


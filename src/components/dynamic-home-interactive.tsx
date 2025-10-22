"use client";

import dynamic from "next/dynamic";

const HomeInteractive = dynamic(() => import("@/components/home-interactive").then(mod => ({ default: mod.HomeInteractive })), {
  ssr: false,
  loading: () => <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
    <div className="bg-gray-200 dark:bg-gray-700 animate-pulse h-12 w-40 rounded-xl"></div>
    <div className="bg-gray-200 dark:bg-gray-700 animate-pulse h-12 w-40 rounded-xl"></div>
  </div>
});

interface DynamicHomeInteractiveProps {
  variant?: "hero" | "cta";
}

export function DynamicHomeInteractive({ variant = "hero" }: DynamicHomeInteractiveProps) {
  return <HomeInteractive variant={variant} />;
}

"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface HomeInteractiveProps {
  variant?: "hero" | "cta";
}

export function HomeInteractive({ variant = "hero" }: HomeInteractiveProps) {
  if (variant === "hero") {
    return (
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <Link
          href="/auth"
          className="group bg-gradient-to-r from-[#1A5276] to-[#34A853] hover:from-[#1A5276]/90 hover:to-[#34A853]/90 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center focus:outline-none focus:ring-2 focus:ring-[#34A853]/50 drop-shadow-sm"
          aria-label="Start your professional journey with LocalPro"
        >
          Start Your Journey
          <ArrowRight className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          href="/marketplace"
          className="group border border-white/30 text-white hover:border-[#34A853] hover:text-[#34A853] font-medium py-2 px-4 rounded-lg transition-all duration-300 hover:shadow-lg flex items-center focus:outline-none focus:ring-2 focus:ring-[#34A853]/50 drop-shadow-sm"
          aria-label="Explore the LocalPro marketplace"
        >
          Explore Marketplace
          <ArrowRight className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
      <Link
        href="/auth"
        className="group bg-gradient-to-r from-[#1A5276] to-[#34A853] hover:from-[#1A5276]/90 hover:to-[#34A853]/90 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center drop-shadow-sm"
      >
        Start Free Trial
        <ArrowRight className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
      <Link
        href="/marketplace"
        className="text-[#34A853] hover:text-[#1A5276] font-medium flex items-center drop-shadow-sm"
      >
        View Demo
        <ArrowRight className="ml-1.5 w-4 h-4" />
      </Link>
    </div>
  );
}

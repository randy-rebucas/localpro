"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface HomeInteractiveProps {
  variant?: "hero" | "cta";
}

export function HomeInteractive({ variant = "hero" }: HomeInteractiveProps) {
  if (variant === "hero") {
    return (
      <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
        <Link
          href="/auth"
          className="group bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-105 flex items-center focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
          aria-label="Start your professional journey with LocalPro"
        >
          Start Your Journey
          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          href="/dashboard"
          className="group border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-600 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover:shadow-lg flex items-center focus:outline-none focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
          aria-label="Explore the LocalPro dashboard"
        >
          Explore Dashboard
          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
      <Link
        href="/auth"
        className="group bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-105 flex items-center"
      >
        Start Free Trial
        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </Link>
      <Link
        href="/dashboard"
        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center"
      >
        View Demo
        <ArrowRight className="ml-2 w-5 h-5" />
      </Link>
    </div>
  );
}

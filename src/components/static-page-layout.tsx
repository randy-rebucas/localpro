import { ReactNode } from "react";

interface StaticPageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function StaticPageLayout({ children, className = "" }: StaticPageLayoutProps) {
  return (
    <div className={`min-h-screen bg-white dark:bg-slate-900 ${className}`}>
      {/* Header and Footer are handled by PublicLayout */}
      {children}
    </div>
  );
}

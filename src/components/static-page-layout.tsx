import { ReactNode } from "react";

interface StaticPageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function StaticPageLayout({ children, className = "" }: StaticPageLayoutProps) {
  return (
    <div className={`min-h-full ${className}`}>
      {/* Header and Footer are handled by PublicLayout */}
      {children}
    </div>
  );
}

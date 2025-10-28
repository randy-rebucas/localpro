import { ReactNode } from "react";
import { StaticHeader } from "./static-header";
import { StaticFooter } from "./static-footer";

interface StaticPageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function StaticPageLayout({ children, className = "" }: StaticPageLayoutProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 ${className}`}>
      <StaticHeader />
      {children}
      <StaticFooter />
    </div>
  );
}

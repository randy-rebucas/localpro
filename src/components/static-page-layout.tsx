import { ReactNode } from "react";
import { StaticHeader } from "./static-header";
import { StaticFooter } from "./static-footer";

interface StaticPageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function StaticPageLayout({ children, className = "" }: StaticPageLayoutProps) {
  return (
    <div className={`min-h-screen bg-white dark:bg-slate-900 ${className}`}>
      <StaticHeader />
      {children}
      <StaticFooter />
    </div>
  );
}

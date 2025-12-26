"use client";

import Link from "next/link";

export type Crumb = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: Crumb[];
  className?: string;
  ariaLabel?: string;
  separator?: string;
};

export function Breadcrumbs({
  items,
  className = "text-sm text-muted-foreground",
  ariaLabel = "Breadcrumb",
  separator = "/",
}: BreadcrumbsProps) {
  return (
    <nav className={`${className}`} aria-label={ariaLabel}>
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className={isLast ? "text-foreground font-medium" : undefined}>
              {item.href && !isLast ? (
                <div className="flex items-center gap-2">
                  <Link href={item.href} className="hover:text-foreground">
                    {item.label}
                  </Link>
                  {!isLast && <span className="select-none">{separator}</span>}
                </div>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;



import Link from "next/link";
import { Logo } from "@/components/ui/logo";

interface HeaderProps {
  className?: string;
}

export function StaticHeader({ className = "" }: HeaderProps) {
  return (
    <header className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-lg ${className}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <Logo size={30} withText={true} />
          </Link>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors font-medium">
              Home
            </Link>
            <Link href="/marketplace" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors font-medium">
              Marketplace
            </Link>
            <Link href="/academy" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors font-medium">
              Academy
            </Link>
            <Link href="/contact" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors font-medium">
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

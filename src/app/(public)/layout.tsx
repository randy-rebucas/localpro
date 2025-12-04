"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { useSession } from "@/hooks/useAuth";
import { getApiToken } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { SessionProvider } from "@/contexts/session-context";
import { 
  Menu, 
  X, 
  User, 
  ChevronDown,
  Facebook,
  Linkedin
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import ErrorBoundary from "@/components/error-boundary";

function PublicLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const apiToken = getApiToken();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Careers", href: "/careers" },
    { name: "Community", href: "/community" },
    { name: "Partners", href: "/partners" },
    { name: "Support", href: "/support" },
    { name: "Contact", href: "/contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href);
  };

  const isAuthenticated = (status === 'authenticated' && (session || apiToken)) || apiToken;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 lg:h-20">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link href="/" className="flex items-center space-x-2 group">
                  <Logo size={32} />
                  <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    LocalPro
                  </span>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex md:items-center md:space-x-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive(item.href)
                        ? "text-emerald-400 bg-emerald-500/10"
                        : "text-slate-300 hover:text-emerald-400 hover:bg-slate-800/50"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Auth Buttons */}
              <div className="hidden md:flex md:items-center md:space-x-3">
                {status === "loading" ? (
                  <div className="h-9 w-24 bg-slate-800 rounded-lg animate-pulse"></div>
                ) : isAuthenticated ? (
                  <div className="relative" ref={userMenuRef}>
                    <Button
                      variant="outline"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 border-slate-700"
                    >
                      <User className="w-4 h-4" />
                      <span>Account</span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-slate-900 rounded-lg shadow-xl border border-slate-700 py-1 z-50">
                        <Link href="/dashboard" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-emerald-400">
                          Dashboard
                        </Link>
                        <Link href="/marketplace" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-emerald-400">
                          Marketplace
                        </Link>
                        <Link href="/profile" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-emerald-400">
                          Profile
                        </Link>
                        <Link href="/settings" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-emerald-400">
                          Settings
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link href="/auth">
                      <Button size="sm" variant="ghost" className="text-white hover:bg-slate-800/50 hover:text-white font-semibold rounded-full px-5 border border-slate-600">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth">
                      <Button size="sm" className="bg-emerald-500 text-white hover:bg-emerald-600 font-bold shadow-lg shadow-emerald-500/30 rounded-full px-5">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-slate-300"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </Button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-slate-800">
                <div className="space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`block px-4 py-2 rounded-lg text-base font-medium ${
                        isActive(item.href)
                          ? "text-emerald-400 bg-emerald-500/10"
                          : "text-slate-300 hover:text-emerald-400 hover:bg-slate-800"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="pt-4 border-t border-slate-800 space-y-2">
                    {isAuthenticated ? (
                      <>
                        <Link href="/dashboard" className="block px-4 py-2 rounded-lg text-base font-medium text-slate-300 hover:text-emerald-400 hover:bg-slate-800">
                          Dashboard
                        </Link>
                        <Link href="/profile" className="block px-4 py-2 rounded-lg text-base font-medium text-slate-300 hover:text-emerald-400 hover:bg-slate-800">
                          Profile
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link href="/auth" className="block px-4 py-2 rounded-lg text-base font-medium text-slate-300 hover:text-emerald-400 hover:bg-slate-800">
                          Sign In
                        </Link>
                        <Link href="/auth" className="block px-4 py-3 rounded-full text-base font-bold bg-emerald-500 text-white text-center hover:bg-emerald-600 shadow-lg shadow-emerald-500/30">
                          Get Started
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-slate-900 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
              <div className="col-span-2">
                <Link href="/" className="flex items-center space-x-2 mb-4">
                  <Logo size={32} />
                  <span className="text-xl font-bold text-white">LocalPro</span>
                </Link>
                <p className="text-slate-400 text-sm mb-6 max-w-xs">
                  Your all-in-one platform for professional services, supplies, education, and business growth.
                </p>
                <div className="flex space-x-4">
                  <a href="https://www.facebook.com/localproasia" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors">
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a href="https://www.linkedin.com/company/localproasia/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-white mb-4">Platform</h3>
                <ul className="space-y-3">
                  {['Marketplace', 'Supplies', 'Rentals', 'Academy', 'Jobs'].map((item) => (
                    <li key={item}>
                      <Link href={`/${item.toLowerCase()}`} className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-white mb-4">Company</h3>
                <ul className="space-y-3">
                  {[
                    { name: 'About Us', href: '/about' },
                    { name: 'Blog', href: '/blog' },
                    { name: 'Careers', href: '/careers' },
                    { name: 'Contact', href: '/contact' },
                    { name: 'Partners', href: '/partners' }
                  ].map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-white mb-4">Legal</h3>
                <ul className="space-y-3">
                  {[
                    { name: 'Privacy Policy', href: '/privacy' },
                    { name: 'Terms of Service', href: '/terms' },
                    { name: 'Security', href: '/security' },
                    { name: 'Help Center', href: '/help-center' }
                  ].map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-slate-500">
                © {new Date().getFullYear()} LocalPro. All rights reserved.
              </p>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <span className="text-sm text-slate-500">Made with</span>
                <span className="text-emerald-400">♥</span>
                <span className="text-sm text-slate-500">in Philippines</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <PublicLayoutContent>{children}</PublicLayoutContent>
    </SessionProvider>
  );
}

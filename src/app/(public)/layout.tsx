"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { useSession } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  X, 
  User, 
  ChevronDown
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import ErrorBoundary from "@/components/error-boundary";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
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
    { name: "Services", href: "/marketplace" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white flex flex-col">
        {/* Public Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 lg:h-20">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link href="/" className="flex items-center space-x-2 group">
                  <Logo className="h-8 w-8 text-green-600 group-hover:text-green-700 transition-colors" />
                  <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
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
                        ? "text-green-600 bg-green-50"
                        : "text-gray-700 hover:text-green-600 hover:bg-gray-50"
                    }`}
                  >
                    {item.name}
                </Link>
                ))}
              </div>

              {/* Auth Buttons */}
              <div className="hidden md:flex md:items-center md:space-x-3">
                {status === "loading" ? (
                  <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
                ) : session ? (
                  <div className="relative" ref={userMenuRef}>
                    <Button
                      variant="outline"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2"
                    >
                      <User className="w-4 h-4" />
                      <span>Account</span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <Link
                          href="/marketplace"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Marketplace
                        </Link>
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Settings
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link href="/auth">
                      <Button variant="ghost" size="sm">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
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
                  className="p-2"
                >
                  {mobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </Button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-gray-200">
                <div className="space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`block px-4 py-2 rounded-lg text-base font-medium ${
                        isActive(item.href)
                          ? "text-green-600 bg-green-50"
                          : "text-gray-700 hover:text-green-600 hover:bg-gray-50"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    {session ? (
                      <>
                        <Link
                          href="/marketplace"
                          className="block px-4 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50"
                        >
                          Marketplace
                        </Link>
                        <Link
                          href="/profile"
                          className="block px-4 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50"
                        >
                          Profile
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/auth"
                          className="block px-4 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50"
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/auth"
                          className="block px-4 py-2 rounded-lg text-base font-medium bg-green-600 text-white text-center hover:bg-green-700"
                        >
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
          {/* Background decoration for certain pages */}
          {pathname === "/" && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
              <div className="absolute top-0 left-0 w-96 h-96 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
            </div>
          )}
          <div className="relative z-10">
            {children}
          </div>
        </main>

        {/* Public Footer */}
        <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <Link href="/" className="flex items-center space-x-2 mb-4">
                  <Logo className="h-8 w-8 text-green-600" />
                  <span className="text-xl font-bold text-gray-900">LocalPro</span>
                </Link>
                <p className="text-gray-600 text-sm max-w-md">
                  Your all-in-one platform for professional services, supplies, education, and more.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Company</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/about" className="text-sm text-gray-600 hover:text-green-600">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="text-sm text-gray-600 hover:text-green-600">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="/careers" className="text-sm text-gray-600 hover:text-green-600">
                      Careers
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/privacy" className="text-sm text-gray-600 hover:text-green-600">
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-sm text-gray-600 hover:text-green-600">
                      Terms
                    </Link>
                  </li>
                  <li>
                    <Link href="/security" className="text-sm text-gray-600 hover:text-green-600">
                      Security
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                © {new Date().getFullYear()} LocalPro. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}


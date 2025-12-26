"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, ArrowRight } from "lucide-react";

interface HeaderProps {
  className?: string;
}

export function StaticHeader({ className = "" }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const servicesDropdownRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleServices = () => setIsServicesOpen(!isServicesOpen);

  // Close services dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (servicesDropdownRef.current && !servicesDropdownRef.current.contains(event.target as Node)) {
        setIsServicesOpen(false);
      }
    }

    if (isServicesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isServicesOpen]);

  return (
    <header className={`bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 ${className}`}>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 z-50 group">
            <Logo size={28} withText={true} className="group-hover:opacity-80 transition-opacity" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link href="/" className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-emerald-400 transition-colors font-medium py-2 px-1 relative group">
              Home
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            </Link>
            
            {/* Services Dropdown */}
            <div className="relative" ref={servicesDropdownRef}>
              <button 
                onClick={toggleServices}
                className="flex items-center space-x-1 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-emerald-400 transition-colors font-medium py-2 px-1 relative group"
              >
                <span>Services</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isServicesOpen ? 'rotate-180' : ''}`} />
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </button>
              {isServicesOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50">
                  <div className="p-4 space-y-3">
                    <Link href="/marketplace" className="block p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" onClick={() => setIsServicesOpen(false)}>
                      <div className="font-medium text-slate-900 dark:text-white">Marketplace</div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">Connect with customers</div>
                    </Link>
                    <Link href="/academy" className="block p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" onClick={() => setIsServicesOpen(false)}>
                      <div className="font-medium text-slate-900 dark:text-white">Academy</div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">Learn & certify</div>
                    </Link>
                    <Link href="/supplies" className="block p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" onClick={() => setIsServicesOpen(false)}>
                      <div className="font-medium text-slate-900 dark:text-white">Supplies</div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">Source equipment</div>
                    </Link>
                    <Link href="/rentals" className="block p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" onClick={() => setIsServicesOpen(false)}>
                      <div className="font-medium text-slate-900 dark:text-white">Rentals</div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">Rent tools & equipment</div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/about" className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-emerald-400 transition-colors font-medium py-2 px-1 relative group">
              About
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            </Link>
            <Link href="/blog" className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-emerald-400 transition-colors font-medium py-2 px-1 relative group">
              Blog
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            </Link>
            <Link href="/contact" className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-emerald-400 transition-colors font-medium py-2 px-1 relative group">
              Contact
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link href="/auth" className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-emerald-400 transition-colors font-medium py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
              Sign In
            </Link>
            <Link href="/auth" className="bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 flex items-center group">
              Get Started
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-50"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900 z-40 transform transition-all duration-300 ease-in-out ${isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
          <div className="px-4 py-6 space-y-4 border-t border-slate-200 dark:border-slate-700 shadow-xl">
            <Link href="/" className="block py-3 text-lg font-medium text-slate-900 dark:text-white hover:text-primary dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 px-3" onClick={toggleMenu}>
              Home
            </Link>
            
            {/* Mobile Services */}
            <div>
              <button
                onClick={toggleServices}
                className="flex items-center justify-between w-full py-3 text-lg font-medium text-slate-900 dark:text-white hover:text-primary dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 px-3"
              >
                <span>Services</span>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isServicesOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isServicesOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pl-4 space-y-2 mt-2">
                  <Link href="/marketplace" className="block py-2 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 px-3" onClick={toggleMenu}>
                    Marketplace
                  </Link>
                  <Link href="/academy" className="block py-2 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 px-3" onClick={toggleMenu}>
                    Academy
                  </Link>
                  <Link href="/supplies" className="block py-2 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 px-3" onClick={toggleMenu}>
                    Supplies
                  </Link>
                  <Link href="/rentals" className="block py-2 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 px-3" onClick={toggleMenu}>
                    Rentals
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/about" className="block py-3 text-lg font-medium text-slate-900 dark:text-white hover:text-primary dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 px-3" onClick={toggleMenu}>
              About
            </Link>
            <Link href="/blog" className="block py-3 text-lg font-medium text-slate-900 dark:text-white hover:text-primary dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 px-3" onClick={toggleMenu}>
              Blog
            </Link>
            <Link href="/contact" className="block py-3 text-lg font-medium text-slate-900 dark:text-white hover:text-primary dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 px-3" onClick={toggleMenu}>
              Contact
            </Link>

            {/* Mobile CTA Buttons */}
            <div className="pt-6 space-y-3 border-t border-slate-200 dark:border-slate-700">
              <Link href="/auth" className="block w-full text-center py-3 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-emerald-400 transition-colors font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" onClick={toggleMenu}>
                Sign In
              </Link>
              <Link href="/auth" className="block w-full text-center bg-gradient-to-r from-primary to-emerald-600 hover:from-primary hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5" onClick={toggleMenu}>
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import React from "react";
import Link from "next/link";

export function MarketplaceFooter() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold text-white mb-4">About</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/about" className="hover:text-emerald-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-emerald-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-emerald-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Help</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/help-center" className="hover:text-emerald-400 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-emerald-400 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/help-center#faqs" className="hover:text-emerald-400 transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Download App</h3>
            <div className="space-y-2">
              <button 
                disabled 
                className="w-full px-4 py-2 bg-slate-700 text-slate-400 rounded-lg text-sm font-medium cursor-not-allowed opacity-60"
              >
                App Store
              </button>
              <button 
                disabled 
                className="w-full px-4 py-2 bg-slate-700 text-slate-400 rounded-lg text-sm font-medium cursor-not-allowed opacity-60"
              >
                Google Play
              </button>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Partner With Us</h3>
            <button 
              disabled 
              className="w-full px-4 py-2 bg-slate-700 text-slate-400 rounded-lg text-sm font-medium cursor-not-allowed opacity-60"
            >
              Become a Partner
            </button>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          <p>© 2024 LocalPro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}


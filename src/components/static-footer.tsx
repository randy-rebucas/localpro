import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function StaticFooter() {
  return (
    <footer className="bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-t border-slate-200 dark:border-slate-700 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <Logo withText={true} size={28} className="text-slate-900 dark:text-white mb-6" />
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
                The ultimate Super App platform for professional services. Connect, grow, and succeed with LocalPro.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                  <span className="text-white text-xs font-bold">f</span>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                  <span className="text-white text-xs font-bold">t</span>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                  <span className="text-white text-xs font-bold">in</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-6 text-lg">Platform</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/marketplace" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors duration-200 flex items-center group">
                  <span className="w-1 h-1 bg-blue-500 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Marketplace
                </Link></li>
                <li><Link href="/academy" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors duration-200 flex items-center group">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Academy
                </Link></li>
                <li><Link href="/rentals" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors duration-200 flex items-center group">
                  <span className="w-1 h-1 bg-purple-500 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Rentals
                </Link></li>
                <li><Link href="/supplies" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors duration-200 flex items-center group">
                  <span className="w-1 h-1 bg-orange-500 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Supplies
                </Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-6 text-lg">Support</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/help-center" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors duration-200 flex items-center group">
                  <span className="w-1 h-1 bg-blue-500 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Help Center
                </Link></li>
                <li><Link href="/community" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors duration-200 flex items-center group">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Community
                </Link></li>
                <li><Link href="/contact" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors duration-200 flex items-center group">
                  <span className="w-1 h-1 bg-purple-500 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Contact Us
                </Link></li>
                <li><Link href="/blog" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors duration-200 flex items-center group">
                  <span className="w-1 h-1 bg-orange-500 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Blog
                </Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-6 text-lg">Legal</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/privacy" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors duration-200 flex items-center group">
                  <span className="w-1 h-1 bg-blue-500 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Privacy Policy
                </Link></li>
                <li><Link href="/terms" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors duration-200 flex items-center group">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Terms of Service
                </Link></li>
                <li><Link href="/security" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors duration-200 flex items-center group">
                  <span className="w-1 h-1 bg-purple-500 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  Security
                </Link></li>
                <li><Link href="/about" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors duration-200 flex items-center group">
                  <span className="w-1 h-1 bg-orange-500 rounded-full mr-3 group-hover:scale-150 transition-transform"></span>
                  About Us
                </Link></li>
              </ul>
            </div>
          </div>
          
          {/* Newsletter Section */}
          <div className="mt-12 p-8 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl border border-blue-100 dark:border-slate-600">
            <div className="max-w-2xl mx-auto text-center">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Stay Updated</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">Get the latest updates and insights delivered to your inbox.</p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-200 dark:border-slate-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                &copy; 2024 LocalPro. All rights reserved.
              </p>
              <div className="flex items-center space-x-6 text-sm text-slate-600 dark:text-slate-300">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                  All systems operational
                </span>
                <span>Made with ❤️ for professionals</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

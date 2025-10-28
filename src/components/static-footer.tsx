import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function StaticFooter() {
  return (
    <footer className="bg-slate-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Logo withText={true} size={24} className="text-white mb-4" />
              <p className="text-slate-400 text-sm">
                The ultimate Super App platform for professional services.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
                <li><Link href="/academy" className="hover:text-white transition-colors">Academy</Link></li>
                <li><Link href="/rentals" className="hover:text-white transition-colors">Rentals</Link></li>
                <li><Link href="/supplies" className="hover:text-white transition-colors">Supplies</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/help-center" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-400">
            <p>&copy; 2024 LocalPro. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

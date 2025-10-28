import Link from "next/link";
import { Logo } from "@/components/ui/logo";

// Types
interface FooterLink {
  href: string;
  label: string;
  color: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  href: string;
  label: string;
  icon: string;
  gradient: string;
}

// Data
const socialLinks: SocialLink[] = [
  {
    href: "https://facebook.com/localpro",
    label: "Facebook",
    icon: "f",
    gradient: "from-blue-500 to-blue-600"
  },
  {
    href: "https://twitter.com/localpro",
    label: "Twitter", 
    icon: "t",
    gradient: "from-emerald-500 to-emerald-600"
  },
  {
    href: "https://linkedin.com/company/localpro",
    label: "LinkedIn",
    icon: "in",
    gradient: "from-purple-500 to-purple-600"
  }
];

const footerSections: FooterSection[] = [
  {
    title: "Platform",
    links: [
      { href: "/marketplace", label: "Marketplace", color: "bg-blue-500" },
      { href: "/academy", label: "Academy", color: "bg-emerald-500" },
      { href: "/rentals", label: "Rentals", color: "bg-purple-500" },
      { href: "/supplies", label: "Supplies", color: "bg-orange-500" }
    ]
  },
  {
    title: "Support",
    links: [
      { href: "/help-center", label: "Help Center", color: "bg-blue-500" },
      { href: "/community", label: "Community", color: "bg-emerald-500" },
      { href: "/contact", label: "Contact Us", color: "bg-purple-500" },
      { href: "/blog", label: "Blog", color: "bg-orange-500" }
    ]
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy", color: "bg-blue-500" },
      { href: "/terms", label: "Terms of Service", color: "bg-emerald-500" },
      { href: "/security", label: "Security", color: "bg-purple-500" },
      { href: "/about", label: "About Us", color: "bg-orange-500" }
    ]
  }
];

// Components
function SocialLinks() {
  return (
    <div className="flex space-x-4">
      {socialLinks.map((social) => (
        <a
          key={social.label}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-8 h-8 bg-gradient-to-br ${social.gradient} rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer`}
          aria-label={social.label}
        >
          <span className="text-white text-xs font-bold">{social.icon}</span>
        </a>
      ))}
    </div>
  );
}

function FooterLink({ link }: { link: FooterLink }) {
  return (
    <li>
      <Link 
        href={link.href} 
        className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors duration-200 flex items-center group"
      >
        <span className={`w-1 h-1 ${link.color} rounded-full mr-3 group-hover:scale-150 transition-transform`}></span>
        {link.label}
      </Link>
    </li>
  );
}

function FooterSection({ section }: { section: FooterSection }) {
  return (
    <div>
      <h3 className="font-semibold text-slate-900 dark:text-white mb-6 text-lg">
        {section.title}
      </h3>
      <ul className="space-y-3 text-sm">
        {section.links.map((link) => (
          <FooterLink key={link.href} link={link} />
        ))}
      </ul>
    </div>
  );
}

function NewsletterSection() {
  return (
    <div className="mt-12 p-8 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl border border-blue-100 dark:border-slate-600">
      <div className="max-w-2xl mx-auto text-center">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          Stay Updated
        </h3>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Get the latest updates and insights delivered to your inbox.
        </p>
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
  );
}

function FooterBottom() {
  return (
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
  );
}

// Main Component
export function StaticFooter() {
  return (
    <footer className="bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-t border-slate-200 dark:border-slate-700 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <Logo 
              withText={true} 
              size={28} 
              className="text-slate-900 dark:text-white mb-6" 
            />
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
              The ultimate Super App platform for professional services. 
              Connect, grow, and succeed with LocalPro.
            </p>
            <SocialLinks />
          </div>

          {/* Footer Sections */}
          {footerSections.map((section) => (
            <FooterSection key={section.title} section={section} />
          ))}
        </div>

        {/* Newsletter Section */}
        <NewsletterSection />

        {/* Footer Bottom */}
        <FooterBottom />
      </div>
    </footer>
  );
}
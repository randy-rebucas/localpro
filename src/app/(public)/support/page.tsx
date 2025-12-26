"use client";

import Link from "next/link";
import { StaticPageLayout } from "@/components/static-page-layout";
import { HeroSection } from "@/components/static-hero";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  ChevronRight, 
  MessageCircle, 
  Phone, 
  Mail,
  Clock,
  HelpCircle,
  FileText,
  ArrowRight,
  Users,
  Shield,
  Zap,
  Package,
  Headphones,
  CheckCircle2,
  AlertCircle,
  LifeBuoy,
  Truck,
  CreditCard,
  RefreshCw,
  Star
} from "lucide-react";

export default function Support() {
  const supportCategories = [
    {
      name: "Orders & Delivery",
      icon: <Truck className="w-5 h-5" />,
      description: "Track orders, delivery issues, returns",
      articles: 15,
      popular: ["Track my order", "Return an item", "Delivery delays"],
      color: "from-emerald-500 to-teal-600"
    },
    {
      name: "Payments & Billing",
      icon: <CreditCard className="w-5 h-5" />,
      description: "Payment issues, invoices, refunds",
      articles: 12,
      popular: ["Request refund", "Payment failed", "Update payment method"],
      color: "from-primary to-indigo-600"
    },
    {
      name: "Supplies & Products",
      icon: <Package className="w-5 h-5" />,
      description: "Product info, availability, quality",
      articles: 18,
      popular: ["Product quality issue", "Check availability", "Bulk orders"],
      color: "from-purple-500 to-pink-600"
    },
    {
      name: "Account Issues",
      icon: <Users className="w-5 h-5" />,
      description: "Login, profile, verification",
      articles: 10,
      popular: ["Reset password", "Verify account", "Update profile"],
      color: "from-amber-500 to-orange-600"
    },
    {
      name: "Seller Support",
      icon: <Star className="w-5 h-5" />,
      description: "Listing, sales, payouts",
      articles: 14,
      popular: ["Create listing", "Manage inventory", "Payout schedule"],
      color: "from-rose-500 to-red-600"
    },
    {
      name: "Safety & Trust",
      icon: <Shield className="w-5 h-5" />,
      description: "Verified suppliers, disputes, fraud",
      articles: 8,
      popular: ["Report issue", "Buyer protection", "Verified suppliers"],
      color: "from-cyan-500 to-primary"
    }
  ];

  const contactMethods = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Live Chat",
      description: "Chat with our support team in real-time",
      availability: "Available 24/7",
      responseTime: "Usually within 2 minutes",
      action: "Start Chat",
      recommended: true,
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Support",
      description: "Send us a detailed message about your issue",
      availability: "24/7",
      responseTime: "Within 24 hours",
      action: "Send Email",
      recommended: false,
      color: "from-primary to-indigo-600"
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Phone Support",
      description: "Speak directly with a support specialist",
      availability: "Mon-Sat 8AM-10PM",
      responseTime: "Immediate",
      action: "Call Now",
      recommended: false,
      color: "from-purple-500 to-pink-600"
    }
  ];

  const quickActions = [
    {
      title: "Track My Order",
      description: "Check the status of your recent orders",
      icon: <Truck className="w-5 h-5" />,
      href: "/orders"
    },
    {
      title: "Request Refund",
      description: "Start a refund request for an order",
      icon: <RefreshCw className="w-5 h-5" />,
      href: "/supplies/my-orders"
    },
    {
      title: "Report an Issue",
      description: "Report a problem with a product or seller",
      icon: <AlertCircle className="w-5 h-5" />,
      href: "/contact"
    },
    {
      title: "Become Verified",
      description: "Learn about supplier verification",
      icon: <CheckCircle2 className="w-5 h-5" />,
      href: "/supplies/verified"
    }
  ];

  const faqs = [
    {
      question: "How do I track my order?",
      answer: "You can track your order by going to 'My Orders' in your account. Click on any order to see real-time tracking information, delivery estimates, and carrier details."
    },
    {
      question: "What is the return policy?",
      answer: "Most items can be returned within 30 days of delivery. Items must be unused and in original packaging. Some categories like consumables may have different policies."
    },
    {
      question: "How do I contact a seller?",
      answer: "You can message sellers directly from their product page or through your order details. Click 'Contact Seller' to start a conversation about your order or product questions."
    },
    {
      question: "What does 'Verified Supplier' mean?",
      answer: "Verified Suppliers have passed our identity verification, business documentation, and quality checks. They maintain high customer satisfaction ratings and reliable delivery performance."
    },
    {
      question: "How long does delivery take?",
      answer: "Delivery times vary by seller and location. Most orders are delivered within 2-7 business days. You can see estimated delivery times on each product page before ordering."
    },
    {
      question: "How do I become a supplier on LocalPro?",
      answer: "To become a supplier, upgrade to a Provider account and complete our verification process. You'll need to provide business documentation and agree to our seller terms."
    }
  ];

  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <HeroSection 
        title="Customer Support"
        subtitle="We're here to help! Get fast answers and support for all your questions"
        highlightText="Support"
        badge="24/7 Help Available"
      >
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for help with orders, payments, products..."
            className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-700 border-2 border-slate-400 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg shadow-lg shadow-emerald-500/10 transition-all hover:border-emerald-500/50 hover:bg-slate-600"
          />
        </div>
      </HeroSection>

      {/* Quick Actions */}
      <section className="py-12 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-3">
              Quick Actions
            </h2>
            <p className="text-slate-400">
              Common tasks you can do right now
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link 
                key={index} 
                href={action.href}
                className="group p-5 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform shadow-lg">
                  {action.icon}
                </div>
                <h3 className="font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-slate-400">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-3">
              Contact Support
            </h2>
            <p className="text-slate-400">
              Choose the best way to reach our team
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <div 
                key={index} 
                className={`group p-6 rounded-2xl bg-slate-800/30 border hover:border-emerald-500/30 transition-all text-center relative ${
                  method.recommended ? 'border-emerald-500/50' : 'border-slate-700/50'
                }`}
              >
                {method.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-emerald-500/30">
                      Recommended
                    </span>
                  </div>
                )}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r ${method.color} text-white mb-4 shadow-lg`}>
                  {method.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  {method.title}
                </h3>
                <p className="text-slate-400 mb-4 text-sm">
                  {method.description}
                </p>
                <div className="space-y-2 text-sm text-slate-500 mb-5">
                  <div className="flex items-center justify-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {method.availability}
                  </div>
                  <div className="flex items-center justify-center">
                    <Zap className="w-4 h-4 mr-2" />
                    {method.responseTime}
                  </div>
                </div>
                <Button className={`w-full rounded-xl ${
                  method.recommended 
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30'
                }`}>
                  {method.action}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Categories */}
      <section className="py-12 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-3">
              Browse by Topic
            </h2>
            <p className="text-slate-400">
              Find help organized by category
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {supportCategories.map((category, index) => (
              <div 
                key={index} 
                className="group p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg`}>
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {category.popular.map((topic, i) => (
                    <div key={i} className="flex items-center text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                      <ChevronRight className="w-4 h-4 mr-1" />
                      {topic}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                  <span className="text-xs text-slate-500">
                    {category.articles} articles
                  </span>
                  <span className="text-sm font-medium text-emerald-400 flex items-center">
                    View all
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400">
              Quick answers to common questions
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-slate-400">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/help-center"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              View all FAQs in Help Center
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-12 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:48px_48px]"></div>
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-8 md:p-12">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <LifeBuoy className="w-8 h-8 text-white" />
                  <h2 className="text-2xl font-bold text-white">LocalPro Buyer Protection</h2>
                </div>
                <p className="text-emerald-100 mb-6">
                  Shop with confidence knowing you&apos;re protected. Our buyer protection covers eligible purchases, ensuring you receive what you ordered or get your money back.
                </p>
                <Link href="/help-center">
                  <Button className="bg-white !text-emerald-600 hover:bg-white/90 font-bold rounded-xl shadow-2xl">
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <CheckCircle2 className="w-6 h-6" />, title: "Money-Back Guarantee", desc: "Full refund if item not as described" },
                  { icon: <Shield className="w-6 h-6" />, title: "Secure Payments", desc: "Your payment info is protected" },
                  { icon: <Headphones className="w-6 h-6" />, title: "24/7 Support", desc: "Help whenever you need it" },
                  { icon: <CheckCircle2 className="w-6 h-6" />, title: "Verified Suppliers", desc: "Trusted and vetted sellers" }
                ].map((item, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="text-white mb-2">{item.icon}</div>
                    <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-emerald-100">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More Help Links */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-3">
              More Ways to Get Help
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: <FileText className="w-6 h-6" />, title: "Help Center", desc: "Browse guides, tutorials, and documentation", href: "/help-center", color: "from-emerald-500 to-teal-600" },
              { icon: <Users className="w-6 h-6" />, title: "Community Forum", desc: "Connect with other users and share experiences", href: "/community", color: "from-primary to-indigo-600" },
              { icon: <Mail className="w-6 h-6" />, title: "Contact Us", desc: "Send us a message or find our office locations", href: "/contact", color: "from-emerald-500 to-teal-600" },
              { icon: <Headphones className="w-6 h-6" />, title: "Partner Support", desc: "Dedicated support for business partners", href: "/partners", color: "from-purple-500 to-pink-600" }
            ].map((item, index) => (
              <Link key={index} href={item.href} className="group">
                <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {item.desc}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}

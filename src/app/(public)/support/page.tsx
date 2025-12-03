import Link from "next/link";
import { StaticPageLayout } from "@/components/static-page-layout";
import { HeroSection } from "@/components/static-hero";
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
      popular: ["Track my order", "Return an item", "Delivery delays"]
    },
    {
      name: "Payments & Billing",
      icon: <CreditCard className="w-5 h-5" />,
      description: "Payment issues, invoices, refunds",
      articles: 12,
      popular: ["Request refund", "Payment failed", "Update payment method"]
    },
    {
      name: "Supplies & Products",
      icon: <Package className="w-5 h-5" />,
      description: "Product info, availability, quality",
      articles: 18,
      popular: ["Product quality issue", "Check availability", "Bulk orders"]
    },
    {
      name: "Account Issues",
      icon: <Users className="w-5 h-5" />,
      description: "Login, profile, verification",
      articles: 10,
      popular: ["Reset password", "Verify account", "Update profile"]
    },
    {
      name: "Seller Support",
      icon: <Star className="w-5 h-5" />,
      description: "Listing, sales, payouts",
      articles: 14,
      popular: ["Create listing", "Manage inventory", "Payout schedule"]
    },
    {
      name: "Safety & Trust",
      icon: <Shield className="w-5 h-5" />,
      description: "Verified suppliers, disputes, fraud",
      articles: 8,
      popular: ["Report issue", "Buyer protection", "Verified suppliers"]
    }
  ];

  const contactMethods = [
    {
      icon: <MessageCircle className="w-6 h-6 text-[#1A5276]" />,
      title: "Live Chat",
      description: "Chat with our support team in real-time",
      availability: "Available 24/7",
      responseTime: "Usually within 2 minutes",
      action: "Start Chat",
      recommended: true
    },
    {
      icon: <Mail className="w-6 h-6 text-[#34A853]" />,
      title: "Email Support",
      description: "Send us a detailed message about your issue",
      availability: "24/7",
      responseTime: "Within 24 hours",
      action: "Send Email",
      recommended: false
    },
    {
      icon: <Phone className="w-6 h-6 text-[#1A5276]" />,
      title: "Phone Support",
      description: "Speak directly with a support specialist",
      availability: "Mon-Sat 8AM-10PM",
      responseTime: "Immediate",
      action: "Call Now",
      recommended: false
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
      answer: "Most items can be returned within 30 days of delivery. Items must be unused and in original packaging. Some categories like consumables may have different policies. Check the product page for specific return terms."
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
      answer: "To become a supplier, upgrade to a Provider account and complete our verification process. You'll need to provide business documentation and agree to our seller terms. Visit the 'List Supply' section to get started."
    }
  ];

  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <HeroSection 
        title="Customer Support"
        subtitle="We're here to help! Get fast answers and support for all your questions"
        highlightText="Support"
        gradientFrom="from-[#1A5276]"
        gradientTo="to-[#34A853]"
      >
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for help with orders, payments, products..."
            className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent text-lg"
          />
        </div>
      </HeroSection>

      {/* Quick Actions */}
      <section className="py-8 bg-white dark:bg-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Quick Actions
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Common tasks you can do right now
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Link 
                  key={index} 
                  href={action.href}
                  className="bg-slate-50 dark:bg-slate-700 rounded-xl p-5 hover:shadow-lg transition-all group border-2 border-transparent hover:border-[#34A853]"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-[#1A5276] to-[#34A853] rounded-lg flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform">
                    {action.icon}
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-[#34A853] transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {action.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-8 bg-slate-50 dark:bg-slate-900">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Contact Support
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Choose the best way to reach our team
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {contactMethods.map((method, index) => (
                <div 
                  key={index} 
                  className={`bg-white dark:bg-slate-800 rounded-xl p-6 text-center hover:shadow-xl transition-all relative ${
                    method.recommended ? 'ring-2 ring-[#34A853]' : ''
                  }`}
                >
                  {method.recommended && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-[#34A853] text-white text-xs font-bold px-3 py-1 rounded-full">
                        Recommended
                      </span>
                    </div>
                  )}
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                    {method.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {method.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
                    {method.description}
                  </p>
                  <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400 mb-5">
                    <div className="flex items-center justify-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {method.availability}
                    </div>
                    <div className="flex items-center justify-center">
                      <Zap className="w-4 h-4 mr-2" />
                      {method.responseTime}
                    </div>
                  </div>
                  <button className={`w-full font-semibold py-3 px-4 rounded-lg transition-colors ${
                    method.recommended 
                      ? 'bg-gradient-to-r from-[#1A5276] to-[#34A853] hover:from-[#1A5276]/90 hover:to-[#34A853]/90 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}>
                    {method.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Support Categories */}
      <section className="py-12 bg-white dark:bg-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Browse by Topic
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Find help organized by category
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {supportCategories.map((category, index) => (
                <div 
                  key={index} 
                  className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1A5276] to-[#34A853] rounded-xl flex items-center justify-center text-white flex-shrink-0">
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-[#34A853] transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    {category.popular.map((topic, i) => (
                      <div key={i} className="flex items-center text-sm text-slate-600 dark:text-slate-300 hover:text-[#34A853] dark:hover:text-[#34A853] transition-colors">
                        <ChevronRight className="w-4 h-4 mr-1 text-slate-400" />
                        {topic}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-600">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {category.articles} articles
                    </span>
                    <span className="text-sm font-medium text-[#34A853] group-hover:text-[#1A5276] transition-colors flex items-center">
                      View all
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-slate-50 dark:bg-slate-900">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Quick answers to common questions
              </p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#1A5276] to-[#34A853] rounded-full flex items-center justify-center flex-shrink-0">
                      <HelpCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300">
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
                className="inline-flex items-center gap-2 text-[#34A853] hover:text-[#1A5276] font-medium transition-colors"
              >
                View all FAQs in Help Center
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-12 bg-white dark:bg-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gradient-to-r from-[#1A5276] to-[#34A853] rounded-2xl p-8 md:p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <LifeBuoy className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">LocalPro Buyer Protection</h2>
                  </div>
                  <p className="text-blue-100 mb-6">
                    Shop with confidence knowing you&apos;re protected. Our buyer protection covers eligible purchases, ensuring you receive what you ordered or get your money back.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link
                      href="/help-center"
                      className="inline-flex items-center gap-2 bg-white text-[#1A5276] font-semibold py-3 px-6 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Learn More
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <CheckCircle2 className="w-6 h-6 mb-2" />
                    <h4 className="font-semibold mb-1">Money-Back Guarantee</h4>
                    <p className="text-sm text-blue-100">Full refund if item not as described</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <Shield className="w-6 h-6 mb-2" />
                    <h4 className="font-semibold mb-1">Secure Payments</h4>
                    <p className="text-sm text-blue-100">Your payment info is protected</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <Headphones className="w-6 h-6 mb-2" />
                    <h4 className="font-semibold mb-1">24/7 Support</h4>
                    <p className="text-sm text-blue-100">Help whenever you need it</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <CheckCircle2 className="w-6 h-6 mb-2" />
                    <h4 className="font-semibold mb-1">Verified Suppliers</h4>
                    <p className="text-sm text-blue-100">Trusted and vetted sellers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More Help Links */}
      <section className="py-8 bg-slate-50 dark:bg-slate-900">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                More Ways to Get Help
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link
                href="/help-center"
                className="bg-white dark:bg-slate-800 rounded-xl p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1A5276] to-[#34A853] rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-[#34A853] transition-colors">
                      Help Center
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      Browse guides, tutorials, and documentation
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#34A853] group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
              <Link
                href="/community"
                className="bg-white dark:bg-slate-800 rounded-xl p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#34A853] to-[#1A5276] rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-[#34A853] transition-colors">
                      Community Forum
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      Connect with other users and share experiences
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#34A853] group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
              <Link
                href="/contact"
                className="bg-white dark:bg-slate-800 rounded-xl p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1A5276] to-[#34A853] rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-[#34A853] transition-colors">
                      Contact Us
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      Send us a message or find our office locations
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#34A853] group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
              <Link
                href="/partners"
                className="bg-white dark:bg-slate-800 rounded-xl p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#34A853] to-[#1A5276] rounded-xl flex items-center justify-center">
                    <Headphones className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-[#34A853] transition-colors">
                      Partner Support
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      Dedicated support for business partners
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#34A853] group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}


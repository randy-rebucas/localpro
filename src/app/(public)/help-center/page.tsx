"use client";

import { StaticPageLayout } from "@/components/static-page-layout";
import { HeroSection } from "@/components/static-hero";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  ChevronRight, 
  BookOpen, 
  MessageCircle, 
  Phone, 
  Mail,
  Clock,
  Star,
  HelpCircle,
  FileText,
  Video,
  Download,
  ExternalLink,
  Users,
  Settings,
  CreditCard,
  Shield,
  Zap,
  Globe,
  Smartphone
} from "lucide-react";

export default function HelpCenter() {
  const categories = [
    {
      name: "Getting Started",
      icon: <Zap className="w-5 h-5" />,
      articles: 12,
      color: "from-emerald-500 to-teal-600"
    },
    {
      name: "Account & Profile",
      icon: <Users className="w-5 h-5" />,
      articles: 8,
      color: "from-blue-500 to-indigo-600"
    },
    {
      name: "Marketplace",
      icon: <Globe className="w-5 h-5" />,
      articles: 15,
      color: "from-purple-500 to-pink-600"
    },
    {
      name: "Payments & Billing",
      icon: <CreditCard className="w-5 h-5" />,
      articles: 10,
      color: "from-amber-500 to-orange-600"
    },
    {
      name: "Mobile App",
      icon: <Smartphone className="w-5 h-5" />,
      articles: 6,
      color: "from-rose-500 to-red-600"
    },
    {
      name: "Security & Privacy",
      icon: <Shield className="w-5 h-5" />,
      articles: 9,
      color: "from-cyan-500 to-blue-600"
    }
  ];

  const popularArticles = [
    {
      title: "How to create your first service listing",
      category: "Marketplace",
      views: 1250,
      helpful: 98,
      lastUpdated: "2 days ago"
    },
    {
      title: "Setting up payment methods",
      category: "Payments & Billing",
      views: 980,
      helpful: 95,
      lastUpdated: "1 week ago"
    },
    {
      title: "Understanding your dashboard",
      category: "Getting Started",
      views: 850,
      helpful: 92,
      lastUpdated: "3 days ago"
    },
    {
      title: "How to verify your account",
      category: "Account & Profile",
      views: 720,
      helpful: 89,
      lastUpdated: "5 days ago"
    },
    {
      title: "Mobile app troubleshooting",
      category: "Mobile App",
      views: 650,
      helpful: 87,
      lastUpdated: "1 week ago"
    }
  ];

  const faqs = [
    {
      question: "How do I get started with LocalPro?",
      answer: "Getting started is easy! Simply create an account, complete your profile, and start listing your services or browsing the marketplace. We'll guide you through each step.",
      category: "Getting Started"
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, GCash, Maya, and bank transfers. We also support local payment methods in the Philippines for your convenience.",
      category: "Payments & Billing"
    },
    {
      question: "How do I contact customer support?",
      answer: "You can reach our support team through live chat, email, or phone. We typically respond within 24 hours and offer 24/7 support for urgent issues.",
      category: "General"
    },
    {
      question: "Is my data secure on LocalPro?",
      answer: "Yes, we use bank-level encryption and security measures to protect your data. We're also compliant with data protection regulations and regularly audit our security practices.",
      category: "Security & Privacy"
    },
    {
      question: "Can I use LocalPro on my mobile device?",
      answer: "Absolutely! We have native mobile apps for iOS and Android, plus a fully responsive web version that works great on any device.",
      category: "Mobile App"
    },
    {
      question: "How do I become a verified professional?",
      answer: "To become verified, complete your profile, upload required documents, and pass our verification process. This helps build trust with customers.",
      category: "Account & Profile"
    }
  ];

  const contactMethods = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Live Chat",
      description: "Get instant help from our support team",
      availability: "24/7",
      responseTime: "Usually within minutes",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Support",
      description: "Send us a detailed message",
      availability: "24/7",
      responseTime: "Within 24 hours",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Phone Support",
      description: "Speak directly with our team",
      availability: "Mon-Fri 9AM-6PM",
      responseTime: "Immediate",
      color: "from-purple-500 to-pink-600"
    }
  ];

  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <HeroSection 
        title="Help Center"
        subtitle="Find answers, get support, and learn how to make the most of LocalPro"
        highlightText="Help"
        badge="We're Here to Help"
      >
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for help articles, guides, and FAQs..."
            className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
          />
        </div>
      </HeroSection>

      {/* Quick Help Categories */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Browse by Category
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Find help organized by topic
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <div key={index} className="group p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all cursor-pointer">
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {category.articles} articles
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-emerald-400 font-medium text-sm">
                  Browse articles
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Popular Articles
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Most viewed and helpful articles
            </p>
          </div>
          <div className="space-y-4">
            {popularArticles.map((article, index) => (
              <div key={index} className="group p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {article.title}
                      </h3>
                      <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/20">
                        {article.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-1" />
                        {article.views} views
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1 text-amber-400" />
                        {article.helpful}% helpful
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Updated {article.lastUpdated}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Quick answers to common questions
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <HelpCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {faq.question}
                      </h3>
                      <span className="bg-slate-700/50 text-slate-400 px-2 py-1 rounded-full text-xs font-medium">
                        {faq.category}
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Still Need Help?
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Our support team is here to help you succeed
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <div key={index} className="group p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all text-center">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r ${method.color} text-white mb-4 shadow-lg`}>
                  {method.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  {method.title}
                </h3>
                <p className="text-slate-400 mb-4 text-sm">
                  {method.description}
                </p>
                <div className="space-y-1 text-sm mb-6">
                  <div className="flex items-center justify-center text-slate-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {method.availability}
                  </div>
                  <div className="flex items-center justify-center text-slate-500">
                    <Zap className="w-3 h-3 mr-1" />
                    {method.responseTime}
                  </div>
                </div>
                <Button className="w-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 rounded-xl">
                  Get Help
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Additional Resources
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Download guides, watch tutorials, and access more help
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <FileText className="w-8 h-8" />, title: "User Guide", desc: "Complete guide to using LocalPro", action: "Download PDF", actionIcon: <Download className="w-4 h-4" />, color: "text-blue-400" },
              { icon: <Video className="w-8 h-8" />, title: "Video Tutorials", desc: "Step-by-step video guides", action: "Watch Now", actionIcon: <ExternalLink className="w-4 h-4" />, color: "text-emerald-400" },
              { icon: <MessageCircle className="w-8 h-8" />, title: "Community Forum", desc: "Connect with other users", action: "Join Discussion", actionIcon: <ExternalLink className="w-4 h-4" />, color: "text-purple-400" },
              { icon: <Settings className="w-8 h-8" />, title: "API Documentation", desc: "Developer resources and APIs", action: "View Docs", actionIcon: <ExternalLink className="w-4 h-4" />, color: "text-amber-400" }
            ].map((resource, index) => (
              <div key={index} className="group p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all text-center cursor-pointer">
                <div className={`${resource.color} mx-auto mb-4`}>
                  {resource.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  {resource.title}
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  {resource.desc}
                </p>
                <div className="flex items-center justify-center text-emerald-400 font-medium text-sm">
                  {resource.actionIcon}
                  <span className="ml-2">{resource.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}

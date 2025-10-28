import { StaticPageLayout } from "@/components/static-page-layout";
import { HeroSection } from "@/components/static-hero";
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
      icon: <Zap className="w-6 h-6" />,
      articles: 12,
      color: "blue"
    },
    {
      name: "Account & Profile",
      icon: <Users className="w-6 h-6" />,
      articles: 8,
      color: "green"
    },
    {
      name: "Marketplace",
      icon: <Globe className="w-6 h-6" />,
      articles: 15,
      color: "purple"
    },
    {
      name: "Payments & Billing",
      icon: <CreditCard className="w-6 h-6" />,
      articles: 10,
      color: "yellow"
    },
    {
      name: "Mobile App",
      icon: <Smartphone className="w-6 h-6" />,
      articles: 6,
      color: "pink"
    },
    {
      name: "Security & Privacy",
      icon: <Shield className="w-6 h-6" />,
      articles: 9,
      color: "red"
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
      answer: "We accept all major credit cards, PayPal, and bank transfers. We also support local payment methods in your region for your convenience.",
      category: "Payments & Billing"
    },
    {
      question: "How do I contact customer support?",
      answer: "You can reach our support team through live chat, email, or phone. We typically respond within 24 hours and offer 24/7 support for urgent issues.",
      category: "General"
    },
    {
      question: "Is my data secure on LocalPro?",
      answer: "Yes, we use bank-level encryption and security measures to protect your data. We're also GDPR compliant and regularly audit our security practices.",
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
      responseTime: "Usually within minutes"
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Support",
      description: "Send us a detailed message",
      availability: "24/7",
      responseTime: "Within 24 hours"
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Phone Support",
      description: "Speak directly with our team",
      availability: "Mon-Fri 9AM-6PM",
      responseTime: "Immediate"
    }
  ];

  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <HeroSection 
        title="Help Center"
        subtitle="Find answers, get support, and learn how to make the most of LocalPro"
        highlightText="Help"
        gradientFrom="from-blue-600"
        gradientTo="to-emerald-600"
      >
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for help articles, guides, and FAQs..."
            className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent text-lg"
          />
        </div>
      </HeroSection>

      {/* Quick Help Categories */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Browse by Category
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Find help organized by topic
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`w-12 h-12 bg-${category.color}-100 dark:bg-${category.color}-900 rounded-lg flex items-center justify-center text-${category.color}-600 dark:text-${category.color}-400`}>
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-emerald-400 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {category.articles} articles
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-blue-600 dark:text-emerald-400 font-medium group-hover:text-blue-700 dark:group-hover:text-emerald-300 transition-colors">
                    Browse articles
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Popular Articles
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Most viewed and helpful articles
              </p>
            </div>
            <div className="space-y-4">
              {popularArticles.map((article, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-emerald-400 transition-colors">
                          {article.title}
                        </h3>
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                          {article.category}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-1" />
                          {article.views} views
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          {article.helpful}% helpful
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Updated {article.lastUpdated}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Quick answers to common questions
              </p>
            </div>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {faq.question}
                        </h3>
                        <span className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-full text-xs font-medium">
                          {faq.category}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Still Need Help?
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Our support team is here to help you succeed
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {contactMethods.map((method, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                    {method.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {method.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    {method.description}
                  </p>
                  <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {method.availability}
                    </div>
                    <div className="flex items-center justify-center">
                      <Zap className="w-4 h-4 mr-2" />
                      {method.responseTime}
                    </div>
                  </div>
                  <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    Get Help
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Additional Resources
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Download guides, watch tutorials, and access more help
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6 text-center hover:shadow-lg transition-shadow cursor-pointer group">
                <FileText className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-emerald-400 transition-colors">
                  User Guide
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                  Complete guide to using LocalPro
                </p>
                <div className="flex items-center justify-center text-blue-600 dark:text-emerald-400 font-medium">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6 text-center hover:shadow-lg transition-shadow cursor-pointer group">
                <Video className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-emerald-400 transition-colors">
                  Video Tutorials
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                  Step-by-step video guides
                </p>
                <div className="flex items-center justify-center text-blue-600 dark:text-emerald-400 font-medium">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Watch Now
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6 text-center hover:shadow-lg transition-shadow cursor-pointer group">
                <MessageCircle className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-emerald-400 transition-colors">
                  Community Forum
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                  Connect with other users
                </p>
                <div className="flex items-center justify-center text-blue-600 dark:text-emerald-400 font-medium">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Join Discussion
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6 text-center hover:shadow-lg transition-shadow cursor-pointer group">
                <Settings className="w-12 h-12 text-orange-600 dark:text-orange-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-emerald-400 transition-colors">
                  API Documentation
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                  Developer resources and APIs
                </p>
                <div className="flex items-center justify-center text-blue-600 dark:text-emerald-400 font-medium">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Docs
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}

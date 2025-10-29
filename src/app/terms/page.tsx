import { StaticPageLayout } from "@/components/static-page-layout";
import { HeroSection } from "@/components/static-hero";
import { 
  FileText, 
  Scale, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Users,
  CreditCard,
  Globe,
  Mail,
  Phone
} from "lucide-react";

export default function TermsOfService() {
  const lastUpdated = "January 15, 2024";

  const sections = [
    {
      title: "Acceptance of Terms",
      icon: <CheckCircle className="w-6 h-6" />,
      content: [
        "By accessing or using LocalPro, you agree to be bound by these Terms of Service",
        "If you do not agree to these terms, you may not use our services",
        "We may update these terms from time to time, and continued use constitutes acceptance",
        "These terms apply to all users, including service providers and customers",
        "You must be at least 18 years old to use our services"
      ]
    },
    {
      title: "Description of Service",
      icon: <Globe className="w-6 h-6" />,
      content: [
        "LocalPro is a platform connecting service providers with customers",
        "We provide marketplace, academy, financial, and other professional services",
        "We facilitate transactions but are not a party to service agreements between users",
        "We reserve the right to modify or discontinue services at any time",
        "We provide tools and resources to help professionals grow their businesses"
      ]
    },
    {
      title: "User Accounts",
      icon: <Users className="w-6 h-6" />,
      content: [
        "You must create an account to use most features of our platform",
        "You are responsible for maintaining the security of your account",
        "You must provide accurate and complete information",
        "You are responsible for all activities under your account",
        "We may suspend or terminate accounts that violate these terms"
      ]
    },
    {
      title: "Service Provider Obligations",
      icon: <Shield className="w-6 h-6" />,
      content: [
        "Service providers must provide accurate information about their services",
        "All services must be performed professionally and in accordance with applicable laws",
        "Service providers must maintain appropriate insurance and licenses",
        "Service providers are responsible for their own tax obligations",
        "Service providers must respond to customer inquiries in a timely manner"
      ]
    },
    {
      title: "Customer Obligations",
      icon: <Users className="w-6 h-6" />,
      content: [
        "Customers must provide accurate information when requesting services",
        "Customers must pay for services as agreed upon",
        "Customers must treat service providers with respect and professionalism",
        "Customers must provide access to work areas as needed",
        "Customers must provide feedback and ratings in good faith"
      ]
    },
    {
      title: "Payment Terms",
      icon: <CreditCard className="w-6 h-6" />,
      content: [
        "All payments are processed securely through our payment partners",
        "Service providers receive payment minus our platform fees",
        "Refunds are subject to our refund policy and applicable laws",
        "We may hold funds in escrow until services are completed",
        "Payment disputes should be reported within 30 days"
      ]
    },
    {
      title: "Prohibited Activities",
      icon: <AlertTriangle className="w-6 h-6" />,
      content: [
        "You may not use our platform for illegal activities",
        "You may not harass, abuse, or harm other users",
        "You may not post false, misleading, or fraudulent information",
        "You may not attempt to circumvent our security measures",
        "You may not use automated systems to access our platform without permission"
      ]
    },
    {
      title: "Intellectual Property",
      icon: <FileText className="w-6 h-6" />,
      content: [
        "LocalPro owns all rights to our platform, software, and content",
        "Users retain ownership of their own content and intellectual property",
        "By using our platform, you grant us a license to use your content as needed",
        "You may not copy, modify, or distribute our content without permission",
        "We respect the intellectual property rights of others"
      ]
    },
    {
      title: "Limitation of Liability",
      icon: <Scale className="w-6 h-6" />,
      content: [
        "LocalPro is not liable for the quality of services provided by third parties",
        "Our liability is limited to the amount you paid for our services",
        "We are not responsible for indirect, incidental, or consequential damages",
        "We do not guarantee the availability or accuracy of our platform",
        "Some jurisdictions may not allow limitation of liability"
      ]
    },
    {
      title: "Termination",
      icon: <AlertTriangle className="w-6 h-6" />,
      content: [
        "Either party may terminate this agreement at any time",
        "We may suspend or terminate accounts for violations of these terms",
        "Upon termination, your right to use our services ceases immediately",
        "We may retain certain information as required by law",
        "Termination does not relieve you of obligations incurred before termination"
      ]
    }
  ];

  const keyPoints = [
    {
      title: "Service Agreement",
      description: "Users enter into service agreements directly with each other, not with LocalPro"
    },
    {
      title: "Platform Fees",
      description: "We charge fees for facilitating transactions and providing platform services"
    },
    {
      title: "Dispute Resolution",
      description: "Disputes between users should be resolved through our dispute resolution process"
    },
    {
      title: "Governing Law",
      description: "These terms are governed by the laws of the State of California"
    }
  ];

  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <HeroSection 
        title="Terms of Service"
        subtitle="Please read these terms carefully before using our platform"
        highlightText="Terms"
        gradientFrom="from-[#1A5276]"
        gradientTo="to-[#34A853]"
      >
        <div className="flex items-center justify-center space-x-4 text-white/90">
          <Calendar className="w-5 h-5" />
          <span>Last updated: {lastUpdated}</span>
        </div>
      </HeroSection>

      {/* Introduction */}
      <section className="py-8 bg-white dark:bg-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[#1A5276]/10 to-[#34A853]/10 rounded-lg p-6 mb-6">
              <div className="flex items-start space-x-3">
                <FileText className="w-6 h-6 text-[#1A5276] mt-1" />
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    Agreement Overview
                  </h2>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                    These Terms of Service (&quot;Terms&quot;) govern your use of LocalPro&apos;s platform and services. 
                    By using our platform, you agree to be bound by these terms. If you do not agree to 
                    these terms, please do not use our services.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                LocalPro provides a platform that connects service providers with customers, facilitates 
                transactions, and offers various professional services. These terms outline the rights and 
                responsibilities of all users on our platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Points */}
      <section className="py-8 bg-slate-50 dark:bg-slate-900">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Key Points
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Important highlights from our terms
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {keyPoints.map((point, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-lg">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {point.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    {point.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 bg-white dark:bg-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="space-y-8">
              {sections.map((section, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#1A5276] to-[#34A853] rounded-lg flex items-center justify-center text-white">
                      {section.icon}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {section.title}
                    </h2>
                  </div>
                  <ul className="space-y-2">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start space-x-3">
                        <CheckCircle className="w-4 h-4 text-[#34A853] mt-1 flex-shrink-0" />
                        <span className="text-slate-600 dark:text-slate-300 text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dispute Resolution */}
      <section className="py-8 bg-slate-50 dark:bg-slate-900">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Dispute Resolution
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                How we handle disputes and conflicts
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Direct Resolution
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    Try to resolve disputes directly with the other party first
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Platform Mediation
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    Use our dispute resolution process if direct resolution fails
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Legal Action
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    As a last resort, disputes may be resolved through legal channels
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-8 bg-white dark:bg-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Questions About These Terms?
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Contact our legal team for clarification
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Mail className="w-6 h-6 text-[#1A5276] mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Email Us
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    legal@localpro.com
                  </p>
                </div>
                <div className="text-center">
                  <Phone className="w-6 h-6 text-[#34A853] mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Call Us
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    +1 (555) 123-4567
                  </p>
                </div>
                <div className="text-center">
                  <FileText className="w-6 h-6 text-[#1A5276] mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Legal Notice
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    Submit a legal inquiry
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}

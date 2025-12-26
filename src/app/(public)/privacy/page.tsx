"use client";

import { StaticPageLayout } from "@/components/static-page-layout";
import { HeroSection } from "@/components/static-hero";
import { 
  Shield, 
  Eye, 
  Lock, 
  Database, 
  Users, 
  Globe,
  FileText,
  CheckCircle,
  Calendar,
  Mail,
  Phone
} from "lucide-react";

export default function PrivacyPolicy() {
  const lastUpdated = "January 15, 2024";

  const sections = [
    {
      title: "Information We Collect",
      icon: <Database className="w-5 h-5" />,
      color: "from-primary to-indigo-600",
      content: [
        "Personal information (name, email, phone number, address)",
        "Profile information (business details, service categories, certifications)",
        "Payment information (processed securely through third-party providers)",
        "Usage data (how you interact with our platform)",
        "Device information (IP address, browser type, operating system)",
        "Location data (with your permission for location-based services)"
      ]
    },
    {
      title: "How We Use Your Information",
      icon: <Users className="w-5 h-5" />,
      color: "from-emerald-500 to-teal-600",
      content: [
        "Provide and improve our services",
        "Process transactions and payments",
        "Communicate with you about your account and services",
        "Send you important updates and notifications",
        "Personalize your experience on our platform",
        "Analyze usage patterns to improve our services",
        "Comply with legal obligations"
      ]
    },
    {
      title: "Information Sharing",
      icon: <Globe className="w-5 h-5" />,
      color: "from-purple-500 to-pink-600",
      content: [
        "We do not sell your personal information to third parties",
        "We may share information with service providers who help us operate our platform",
        "We may share information when required by law or to protect our rights",
        "We may share aggregated, anonymized data for research purposes",
        "We may share information with your consent for specific purposes"
      ]
    },
    {
      title: "Data Security",
      icon: <Lock className="w-5 h-5" />,
      color: "from-amber-500 to-orange-600",
      content: [
        "We use industry-standard encryption to protect your data",
        "We implement access controls and authentication measures",
        "We regularly audit our security practices",
        "We train our employees on data protection best practices",
        "We have incident response procedures in place",
        "We use secure data centers and cloud infrastructure"
      ]
    },
    {
      title: "Your Rights",
      icon: <CheckCircle className="w-5 h-5" />,
      color: "from-rose-500 to-red-600",
      content: [
        "Access your personal information",
        "Correct inaccurate information",
        "Delete your account and data",
        "Export your data",
        "Opt out of marketing communications",
        "Withdraw consent for data processing",
        "File a complaint with supervisory authorities"
      ]
    },
    {
      title: "Cookies and Tracking",
      icon: <Eye className="w-5 h-5" />,
      color: "from-cyan-500 to-primary",
      content: [
        "We use cookies to improve your experience",
        "We use analytics cookies to understand usage patterns",
        "We use marketing cookies to show relevant ads",
        "You can control cookie settings in your browser",
        "Some features may not work if cookies are disabled",
        "We provide clear information about our cookie usage"
      ]
    }
  ];

  const dataTypes = [
    {
      category: "Personal Information",
      examples: ["Name", "Email address", "Phone number", "Physical address", "Date of birth"],
      purpose: "Account creation, identity verification, communication"
    },
    {
      category: "Business Information",
      examples: ["Business name", "Service categories", "Certifications", "Insurance details", "Tax information"],
      purpose: "Service provider verification, marketplace listings, compliance"
    },
    {
      category: "Financial Information",
      examples: ["Payment methods", "Transaction history", "Bank account details", "Tax ID", "Financial statements"],
      purpose: "Payment processing, financial services, tax reporting"
    },
    {
      category: "Usage Data",
      examples: ["Page views", "Click patterns", "Search queries", "Time spent", "Feature usage"],
      purpose: "Platform improvement, personalization, analytics"
    },
    {
      category: "Technical Data",
      examples: ["IP address", "Device type", "Browser version", "Operating system", "Location data"],
      purpose: "Security, fraud prevention, service optimization"
    }
  ];

  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <HeroSection 
        title="Privacy Policy"
        subtitle="Your privacy is important to us. Learn how we collect, use, and protect your information."
        highlightText="Privacy"
        badge="Your Data, Your Control"
      >
        <div className="flex items-center justify-center space-x-2 text-slate-400">
          <Calendar className="w-5 h-5" />
          <span>Last updated: {lastUpdated}</span>
        </div>
      </HeroSection>

      {/* Introduction */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl"></div>
            <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Our Commitment to Privacy
                  </h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    At LocalPro, we are committed to protecting your privacy and ensuring the security of your personal information. 
                    This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
                    platform and services. We believe in transparency and giving you control over your data.
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    This Privacy Policy applies to all users of LocalPro, including service providers, customers, and visitors to our website. 
                    By using our services, you agree to the collection and use of information in accordance with this policy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sections.map((section, index) => (
              <div key={index} className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-10 h-10 bg-gradient-to-r ${section.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                    {section.icon}
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {section.title}
                  </h2>
                </div>
                <ul className="space-y-3">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-3">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-400 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Types Table */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Data We Collect
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Detailed breakdown of the information we collect and why
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full rounded-2xl overflow-hidden">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Data Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Examples
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Purpose
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {dataTypes.map((dataType, index) => (
                  <tr key={index} className="bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {dataType.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      <ul className="list-disc list-inside space-y-1">
                        {dataType.examples.map((example, exampleIndex) => (
                          <li key={exampleIndex}>{example}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {dataType.purpose}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Your Rights */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Your Privacy Rights
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              You have control over your personal information
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
              <h3 className="text-xl font-semibold text-white mb-4">
                Access & Control
              </h3>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>View and download your data</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Update your profile information</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Change your privacy settings</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Manage your communication preferences</span>
                </li>
              </ul>
            </div>
            <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
              <h3 className="text-xl font-semibold text-white mb-4">
                Data Portability
              </h3>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Export your data in common formats</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Transfer your data to other services</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Request data deletion</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Object to certain data processing</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Questions About Privacy?
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Contact our privacy team for any questions or concerns
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 text-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Email Us
              </h3>
              <p className="text-emerald-400 text-sm">
                privacy@localpro.com
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 text-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Call Us
              </h3>
              <p className="text-slate-400 text-sm">
                +63 917 915 7515
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 text-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Data Request
              </h3>
              <p className="text-slate-400 text-sm">
                Submit a data request form
              </p>
            </div>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}

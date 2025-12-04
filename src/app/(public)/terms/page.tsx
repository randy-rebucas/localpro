"use client";

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
      icon: <CheckCircle className="w-5 h-5" />,
      color: "from-emerald-500 to-teal-600",
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
      icon: <Globe className="w-5 h-5" />,
      color: "from-blue-500 to-indigo-600",
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
      icon: <Users className="w-5 h-5" />,
      color: "from-purple-500 to-pink-600",
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
      icon: <Shield className="w-5 h-5" />,
      color: "from-amber-500 to-orange-600",
      content: [
        "Service providers must provide accurate information about their services",
        "All services must be performed professionally and in accordance with applicable laws",
        "Service providers must maintain appropriate insurance and licenses",
        "Service providers are responsible for their own tax obligations",
        "Service providers must respond to customer inquiries in a timely manner"
      ]
    },
    {
      title: "Payment Terms",
      icon: <CreditCard className="w-5 h-5" />,
      color: "from-rose-500 to-red-600",
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
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "from-cyan-500 to-blue-600",
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
      icon: <FileText className="w-5 h-5" />,
      color: "from-emerald-500 to-teal-600",
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
      icon: <Scale className="w-5 h-5" />,
      color: "from-blue-500 to-indigo-600",
      content: [
        "LocalPro is not liable for the quality of services provided by third parties",
        "Our liability is limited to the amount you paid for our services",
        "We are not responsible for indirect, incidental, or consequential damages",
        "We do not guarantee the availability or accuracy of our platform",
        "Some jurisdictions may not allow limitation of liability"
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
      description: "These terms are governed by the laws of the Republic of the Philippines"
    }
  ];

  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <HeroSection 
        title="Terms of Service"
        subtitle="Please read these terms carefully before using our platform"
        highlightText="Terms"
        badge="Legal Agreement"
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
                  <FileText className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Agreement Overview
                  </h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    These Terms of Service (&quot;Terms&quot;) govern your use of LocalPro&apos;s platform and services. 
                    By using our platform, you agree to be bound by these terms. If you do not agree to 
                    these terms, please do not use our services.
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    LocalPro provides a platform that connects service providers with customers, facilitates 
                    transactions, and offers various professional services. These terms outline the rights and 
                    responsibilities of all users on our platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Points */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Key Points
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Important highlights from our terms
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {keyPoints.map((point, index) => (
              <div key={index} className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {point.title}
                </h3>
                <p className="text-slate-400">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-slate-900/50">
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

      {/* Dispute Resolution */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Dispute Resolution
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              How we handle disputes and conflicts
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Direct Resolution", desc: "Try to resolve disputes directly with the other party first", color: "from-blue-500 to-indigo-600" },
              { step: "2", title: "Platform Mediation", desc: "Use our dispute resolution process if direct resolution fails", color: "from-emerald-500 to-teal-600" },
              { step: "3", title: "Legal Action", desc: "As a last resort, disputes may be resolved through legal channels", color: "from-purple-500 to-pink-600" }
            ].map((item, index) => (
              <div key={index} className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 text-center">
                <div className={`w-14 h-14 bg-gradient-to-r ${item.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <span className="text-2xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Questions About These Terms?
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Contact our legal team for clarification
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
                legal@localpro.com
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
                Legal Notice
              </h3>
              <p className="text-slate-400 text-sm">
                Submit a legal inquiry
              </p>
            </div>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}

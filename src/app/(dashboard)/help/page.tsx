"use client";

import Link from "next/link";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { HelpCircle, Mail, ArrowRight, Search, Clock, MessageSquare, Phone } from "lucide-react";

const faqs = [
  {
    question: "How do I change my password?",
    answer: "Go to Settings and update it under the Security section.",
    href: "/settings",
    color: "blue"
  },
  {
    question: "How do I manage notifications?",
    answer: "Visit Notifications to mark as read, delete, or adjust your preferences.",
    href: "/notifications",
    color: "green"
  },
  {
    question: "How do I update my profile?",
    answer: "Visit Profile to edit your details, avatar, and portfolio.",
    href: "/profile",
    color: "purple"
  },
  {
    question: "How do I create a service listing?",
    answer: "Navigate to Create Service to add your professional services.",
    href: "/marketplace/create-service",
    color: "orange"
  },
  {
    question: "How do I book a service?",
    answer: "Browse services in the Marketplace and click 'Book Now' on any service you're interested in.",
    href: "/marketplace",
    color: "red"
  }
];

const supportOptions = [
  {
    icon: Mail,
    title: "Email Support",
    description: "Get help via email",
    action: "support@localpro.app",
    href: "mailto:support@localpro.app",
    bgColor: "bg-green-100",
    textColor: "text-green-600",
    hoverColor: "hover:text-green-700"
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    description: "Chat with our support team",
    action: "Start Chat",
    bgColor: "bg-blue-100",
    textColor: "text-blue-600",
    hoverColor: "hover:text-blue-700"
  },
  {
    icon: Phone,
    title: "Phone Support",
    description: "Call us directly",
    action: "+1 (555) LOCALPRO",
    href: "tel:+1-555-LOCALPRO",
    bgColor: "bg-purple-100",
    textColor: "text-purple-600",
    hoverColor: "hover:text-purple-700"
  },
  {
    icon: Clock,
    title: "Response Time",
    description: "We typically respond within 24 hours",
    action: null,
    bgColor: "bg-orange-100",
    textColor: "text-orange-600"
  }
];

export default function HelpPage() {
  return (
    <div className="space-y-4">
      <Breadcrumbs
        className="text-sm text-gray-500 mb-4"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Help Center" },
        ]}
      />

      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-700">Help Center</h1>
          <p className="text-sm text-gray-500">Find answers and get support</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">FAQ</h3>
          </div>
          
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className={`border-l-4 border-${faq.color}-200 pl-3 py-2`}>
                <h4 className="font-medium text-gray-900 mb-1 text-sm">{faq.question}</h4>
                <p className="text-xs text-gray-600">
                  {faq.answer.split(' ').slice(0, -2).join(' ')} 
                  <Link href={faq.href} className={`text-${faq.color}-600 ${faq.color === 'blue' ? 'hover:text-blue-700' : faq.color === 'green' ? 'hover:text-green-700' : faq.color === 'purple' ? 'hover:text-purple-700' : faq.color === 'orange' ? 'hover:text-orange-700' : 'hover:text-red-700'} font-medium`}>
                    {faq.answer.split(' ').slice(-2).join(' ')}
                  </Link>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Contact Support</h3>
          </div>
          
          <p className="text-gray-600 mb-4 text-sm">
            Need more help? Our support team is here to assist you.
          </p>
          
          <div className="space-y-3">
            {supportOptions.map((option, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-8 h-8 ${option.bgColor} rounded-lg flex items-center justify-center`}>
                  <option.icon className={`w-4 h-4 ${option.textColor}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">{option.title}</h4>
                  <p className="text-xs text-gray-600">{option.description}</p>
                  {option.action && (
                    option.href ? (
                      <a href={option.href} className={`text-xs ${option.textColor} ${option.hoverColor} font-medium`}>
                        {option.action}
                      </a>
                    ) : (
                      <button className={`text-xs ${option.textColor} ${option.hoverColor} font-medium`}>
                        {option.action}
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 text-xs text-gray-600 hover:text-gray-800 font-medium"
            >
              <ArrowRight className="w-3 h-3" />
              Return to Dashboard
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}



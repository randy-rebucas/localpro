"use client";

import Link from "next/link";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { 
  HelpCircle, 
  BookOpen, 
  Bell, 
  Settings, 
  MessageSquare, 
  Mail, 
  ArrowRight,
  ChevronRight,
  Search,
  Phone,
  Clock
} from "lucide-react";

export default function HelpPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        className="text-sm text-gray-500 mb-4"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Help Center" },
        ]}
      />

      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center shadow-lg">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
            <p className="text-gray-600 mt-1">Find answers, get support, and learn how to use LocalPro effectively</p>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link 
          href="/profile" 
          className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-green-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">Profile Setup</h3>
              <p className="text-sm text-gray-600 mt-1">Set up your profile</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </Link>

        <Link 
          href="/notifications" 
          className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-green-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <Bell className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">Notifications</h3>
              <p className="text-sm text-gray-600 mt-1">Manage your alerts</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
          </div>
        </Link>

        <Link 
          href="/settings" 
          className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-green-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">Settings</h3>
              <p className="text-sm text-gray-600 mt-1">Account preferences</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
          </div>
        </Link>

        <Link 
          href="/dashboard" 
          className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-green-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center group-hover:bg-orange-100 transition-colors">
              <MessageSquare className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-orange-700 transition-colors">Dashboard</h3>
              <p className="text-sm text-gray-600 mt-1">Browse features</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* FAQs */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Frequently Asked Questions</h3>
          </div>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-200 pl-4 py-2">
              <h4 className="font-medium text-gray-900 mb-2">How do I change my password?</h4>
              <p className="text-sm text-gray-600">
                Open <Link href="/settings" className="text-blue-600 hover:text-blue-700 font-medium">Settings</Link> and update it under the Security section.
              </p>
            </div>
            <div className="border-l-4 border-green-200 pl-4 py-2">
              <h4 className="font-medium text-gray-900 mb-2">How do I manage notifications?</h4>
              <p className="text-sm text-gray-600">
                Go to <Link href="/notifications" className="text-green-600 hover:text-green-700 font-medium">Notifications</Link> to mark as read, delete, or adjust your preferences.
              </p>
            </div>
            <div className="border-l-4 border-purple-200 pl-4 py-2">
              <h4 className="font-medium text-gray-900 mb-2">How do I update my profile?</h4>
              <p className="text-sm text-gray-600">
                Visit <Link href="/profile" className="text-purple-600 hover:text-purple-700 font-medium">Profile</Link> to edit your details, avatar, and portfolio.
              </p>
            </div>
            <div className="border-l-4 border-orange-200 pl-4 py-2">
              <h4 className="font-medium text-gray-900 mb-2">How do I create a service listing?</h4>
              <p className="text-sm text-gray-600">
                Navigate to <Link href="/marketplace/create-service" className="text-orange-600 hover:text-orange-700 font-medium">Create Service</Link> to add your professional services.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Contact Support</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Need more help? Our support team is here to assist you with any questions or issues.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Email Support</h4>
                <p className="text-sm text-gray-600">Get help via email</p>
                <a 
                  href="mailto:support@localpro.app" 
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  support@localpro.app
                </a>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Response Time</h4>
                <p className="text-sm text-gray-600">We typically respond within 24 hours</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              <ArrowRight className="w-4 h-4" />
              Return to Dashboard
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}



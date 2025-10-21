"use client";

import Link from "next/link";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { HelpCircle, BookOpen, Bell, Settings, MessageSquare } from "lucide-react";

export default function HelpPage() {
  return (
    <div>
      {/* Breadcrumbs */}
      <Breadcrumbs
        className="text-sm text-gray-500 mb-4"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Help" },
        ]}
      />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Help Center</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick links */}
        <section className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Quick links</h3>
          <ul className="grid grid-cols-1 gap-2">
            <li>
              <Link href="/profile" className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-600">
                <BookOpen className="w-5 h-5 text-gray-700" />
                <span className="text-base font-medium text-gray-900">Set up your profile</span>
              </Link>
            </li>
            <li>
              <Link href="/notifications" className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-600">
                <Bell className="w-5 h-5 text-gray-700" />
                <span className="text-base font-medium text-gray-900">Manage notifications</span>
              </Link>
            </li>
            <li>
              <Link href="/settings" className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-600">
                <Settings className="w-5 h-5 text-gray-700" />
                <span className="text-base font-medium text-gray-900">Update account settings</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-600">
                <MessageSquare className="w-5 h-5 text-gray-700" />
                <span className="text-base font-medium text-gray-900">Browse dashboard features</span>
              </Link>
            </li>
          </ul>
        </section>

        {/* FAQs */}
        <section className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">FAQs</h3>
          <ul className="text-sm text-gray-700 space-y-3">
            <li>
              <p className="font-medium text-gray-900">How do I change my password?</p>
              <p>Open <Link href="/dashboard/settings" className="text-green-700 hover:text-green-800">Settings</Link> and update it under Security.</p>
            </li>
            <li>
              <p className="font-medium text-gray-900">How do I manage notifications?</p>
              <p>Go to <Link href="/dashboard/notifications" className="text-green-700 hover:text-green-800">Notifications</Link> to mark as read or delete.</p>
            </li>
            <li>
              <p className="font-medium text-gray-900">How do I update my profile?</p>
              <p>Visit <Link href="/dashboard/profile" className="text-green-700 hover:text-green-800">Profile</Link> to edit details, avatar, and portfolio.</p>
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section className="bg-white border rounded-lg p-4 md:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-2">Need more help?</h3>
          <p className="text-sm text-gray-700 mb-3">
            Contact our support team and we will get back to you shortly.
          </p>
          <div className="flex items-center gap-4">
            <a href="mailto:support@localpro.app" className="text-sm text-green-700 hover:text-green-800">Email support@localpro.app</a>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-800">Return to dashboard</Link>
          </div>
        </section>
      </div>
    </div>
  );
}



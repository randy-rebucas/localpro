"use client";

import { PhoneFormatterDemo } from '@/components/phone-formatter-demo';

export default function PhoneDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Phone Number Formatter Demo
          </h1>
          <p className="text-lg text-gray-600">
            Test the automatic phone number formatting with country detection
          </p>
        </div>
        
        <PhoneFormatterDemo />
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { PhoneInput } from '@/components/ui/phone-input';
import { phoneFormatter, CountryInfo } from '@/lib/phone-formatter';

export const PhoneFormatterDemo: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [detectedCountry, setDetectedCountry] = useState<CountryInfo | null>(null);
  const [formattedDisplay, setFormattedDisplay] = useState('');
  const [validation, setValidation] = useState({ isValid: true, error: '' });

  useEffect(() => {
    // Get detected country
    const country = phoneFormatter.getUserCountry();
    setDetectedCountry(country);
  }, []);

  useEffect(() => {
    if (phoneNumber) {
      const formatted = phoneFormatter.getFormattedDisplay(phoneNumber);
      setFormattedDisplay(formatted);
      
      const validationResult = phoneFormatter.validatePhoneNumber(phoneNumber);
      setValidation({
        isValid: validationResult.isValid,
        error: validationResult.error || ''
      });
    } else {
      setFormattedDisplay('');
      setValidation({ isValid: true, error: '' });
    }
  }, [phoneNumber]);

  const testNumbers = [
    { label: 'US Local (starts with 0)', number: '05551234567' },
    { label: 'Philippines Local', number: '09123456789' },
    { label: 'UK Local', number: '07700900123' },
    { label: 'Already International', number: '+1234567890' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Phone Number Formatter Demo</h2>
      
      {/* Detected Country Info */}
      <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
        <h3 className="text-lg font-semibold text-primary mb-2">Detected Country</h3>
        {detectedCountry ? (
          <div className="space-y-1">
            <p className="text-primary">
              <strong>Country:</strong> {detectedCountry.name} ({detectedCountry.code})
            </p>
            <p className="text-primary">
              <strong>Dial Code:</strong> {detectedCountry.dialCode}
            </p>
            <p className="text-primary">
              <strong>Format:</strong> {detectedCountry.format}
            </p>
            <p className="text-primary">
              <strong>Example:</strong> {detectedCountry.example}
            </p>
          </div>
        ) : (
          <p className="text-primary">Detecting country...</p>
        )}
      </div>

      {/* Phone Input */}
      <div className="mb-6">
        <PhoneInput
          value={phoneNumber}
          onChange={setPhoneNumber}
          label="Phone Number"
          placeholder="Enter your phone number"
        />
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Formatted Result</h3>
          <p className="text-gray-700 font-mono text-lg">
            {formattedDisplay || 'No number entered'}
          </p>
        </div>

        <div className={`p-4 rounded-lg ${validation.isValid ? 'bg-accent/5 border border-accent/20' : 'bg-red-50 border border-red-200'}`}>
          <h3 className={`text-lg font-semibold mb-2 ${validation.isValid ? 'text-accent' : 'text-red-800'}`}>
            Validation
          </h3>
          <p className={validation.isValid ? 'text-accent' : 'text-red-700'}>
            {validation.isValid ? '✅ Valid phone number' : `❌ ${validation.error}`}
          </p>
        </div>
      </div>

      {/* Test Numbers */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Test with Sample Numbers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {testNumbers.map((test, index) => (
            <button
              key={index}
              onClick={() => setPhoneNumber(test.number)}
              className="p-3 text-left bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition-colors"
            >
              <div className="font-medium text-gray-800">{test.label}</div>
              <div className="text-sm text-gray-600 font-mono">{test.number}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">How it works:</h3>
        <ul className="text-yellow-700 space-y-1 text-sm">
          <li>• <strong>Auto-detection:</strong> Automatically detects your country using timezone and geolocation</li>
          <li>• <strong>Local to International:</strong> Converts numbers starting with &quot;0&quot; to international format</li>
          <li>• <strong>Smart Formatting:</strong> Applies country-specific formatting rules</li>
          <li>• <strong>Real-time Validation:</strong> Validates phone numbers as you type</li>
          <li>• <strong>Fallback Support:</strong> Works even if country detection fails</li>
        </ul>
      </div>
    </div>
  );
};

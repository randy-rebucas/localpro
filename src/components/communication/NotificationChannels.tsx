"use client";

import { useState, useCallback } from 'react';
import { Mail, MessageSquare, Send, X, Check } from 'lucide-react';
import { CommunicationAPI } from '@/lib/communication-utils';

interface NotificationChannelsProps {
  isOpen: boolean;
  onClose: () => void;
  recipient?: {
    email?: string;
    phone?: string;
    name?: string;
  };
}

export default function NotificationChannels({ 
  isOpen, 
  onClose, 
  recipient 
}: NotificationChannelsProps) {
  const [activeChannel, setActiveChannel] = useState<'email' | 'sms'>('email');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email form state
  const [emailData, setEmailData] = useState({
    to: recipient?.email || '',
    subject: '',
    content: '',
    template: ''
  });

  // SMS form state
  const [smsData, setSmsData] = useState({
    to: recipient?.phone || '',
    message: ''
  });

  const handleEmailSend = useCallback(async () => {
    if (!emailData.to || !emailData.subject || !emailData.content) {
      setError('Please fill in all email fields');
      return;
    }

    setSending(true);
    setError(null);

    try {
      // API expects: { to, subject, template, data }
      // If template is provided, use it; otherwise use content as data
      await CommunicationAPI.sendEmailNotification(
        emailData.to,
        emailData.subject,
        emailData.template || undefined,
        emailData.content // Pass content as data
      );
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  }, [emailData, onClose]);

  const handleSmsSend = useCallback(async () => {
    if (!smsData.to || !smsData.message) {
      setError('Please fill in all SMS fields');
      return;
    }

    setSending(true);
    setError(null);

    try {
      // API expects: { to, message }
      await CommunicationAPI.sendSmsNotification(
        smsData.to,
        smsData.message
      );
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  }, [smsData, onClose]);

  const resetForm = useCallback(() => {
    setEmailData({
      to: recipient?.email || '',
      subject: '',
      content: '',
      template: ''
    });
    setSmsData({
      to: recipient?.phone || '',
      message: ''
    });
    setError(null);
    setSuccess(false);
  }, [recipient]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Send Notification</h3>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Channel Selection */}
        <div className="p-4 border-b">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveChannel('email')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                activeChannel === 'email'
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
            <button
              onClick={() => setActiveChannel('sms')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                activeChannel === 'sms'
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              SMS
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-4">
          {activeChannel === 'email' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={emailData.to}
                  onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                  placeholder="Email subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Content
                </label>
                <textarea
                  value={emailData.content}
                  onChange={(e) => setEmailData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                  rows={4}
                  placeholder="Enter your message content..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template (Optional)
                </label>
                <select
                  value={emailData.template}
                  onChange={(e) => setEmailData(prev => ({ ...prev, template: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                >
                  <option value="">No Template (Plain Text)</option>
                  <option value="default">Default Template</option>
                  <option value="booking">Booking Notification</option>
                  <option value="payment">Payment Notification</option>
                  <option value="system">System Alert</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={smsData.to}
                  onChange={(e) => setSmsData(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={smsData.message}
                  onChange={(e) => setSmsData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                  rows={3}
                  placeholder="Enter your SMS message..."
                  maxLength={160}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {smsData.message.length}/160 characters
                </div>
              </div>

            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-accent/5 border border-accent/20 rounded-lg text-accent text-sm flex items-center gap-2">
              <Check className="h-4 w-4" />
              {activeChannel === 'email' ? 'Email sent successfully!' : 'SMS sent successfully!'}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={activeChannel === 'email' ? handleEmailSend : handleSmsSend}
            disabled={sending}
            className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send {activeChannel === 'email' ? 'Email' : 'SMS'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

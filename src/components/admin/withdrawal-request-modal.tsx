"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, DollarSign } from "lucide-react";
import { logger } from "@/lib/logger";

interface WithdrawalRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (withdrawal: WithdrawalData) => void;
  availableBalance: number;
}

export interface WithdrawalData {
  amount: number;
  method: string;
  accountDetails: {
    accountNumber?: string;
    bankName?: string;
    paypalEmail?: string;
    swiftCode?: string;
  };
  notes?: string;
}

export function WithdrawalRequestModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  availableBalance 
}: WithdrawalRequestModalProps) {
  const [formData, setFormData] = useState<WithdrawalData>({
    amount: 0,
    method: '',
    accountDetails: {},
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit(formData);
      setFormData({
        amount: 0,
        method: '',
        accountDetails: {},
        notes: ''
      });
      onClose();
    } catch (error) {
      logger.error('Error submitting withdrawal', error instanceof Error ? error : new Error(String(error)), { amount: formData.amount, method: formData.method });
    } finally {
      setLoading(false);
    }
  };

  const renderAccountFields = () => {
    switch (formData.method) {
      case 'bank':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.accountDetails.bankName || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  accountDetails: { ...formData.accountDetails, bankName: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={formData.accountDetails.accountNumber || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  accountDetails: { ...formData.accountDetails, accountNumber: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SWIFT Code
              </label>
              <input
                type="text"
                value={formData.accountDetails.swiftCode || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  accountDetails: { ...formData.accountDetails, swiftCode: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
          </>
        );
      case 'paypal':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PayPal Email
            </label>
            <input
              type="email"
              value={formData.accountDetails.paypalEmail || ''}
              onChange={(e) => setFormData({
                ...formData,
                accountDetails: { ...formData.accountDetails, paypalEmail: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              required
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-lg mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Request Withdrawal
            </h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="p-1"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Available Balance: <span className="font-semibold">${availableBalance.toFixed(2)}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={availableBalance}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Withdrawal Method
              </label>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                required
              >
                <option value="">Select method</option>
                <option value="bank">Bank Transfer</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>

            {formData.method && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Account Details</h3>
                {renderAccountFields()}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="Any additional notes..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || formData.amount > availableBalance}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {loading ? 'Processing...' : 'Request Withdrawal'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

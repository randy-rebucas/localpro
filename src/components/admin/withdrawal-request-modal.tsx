"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { DollarSign } from "lucide-react";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";

interface WithdrawalRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (withdrawal: WithdrawalData) => Promise<void>;
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
      toast.success('Withdrawal request submitted successfully');
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit withdrawal request';
      logger.error('Error submitting withdrawal', error instanceof Error ? error : new Error(String(error)), { amount: formData.amount, method: formData.method });
      toast.error(errorMessage);
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
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Bank Name *
              </label>
              <input
                type="text"
                value={formData.accountDetails.bankName || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  accountDetails: { ...formData.accountDetails, bankName: e.target.value }
                })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Account Number *
              </label>
              <input
                type="text"
                value={formData.accountDetails.accountNumber || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  accountDetails: { ...formData.accountDetails, accountNumber: e.target.value }
                })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                SWIFT Code
              </label>
              <input
                type="text"
                value={formData.accountDetails.swiftCode || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  accountDetails: { ...formData.accountDetails, swiftCode: e.target.value }
                })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </>
        );
      case 'paypal':
        return (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              PayPal Email *
            </label>
            <input
              type="email"
              value={formData.accountDetails.paypalEmail || ''}
              onChange={(e) => setFormData({
                ...formData,
                accountDetails: { ...formData.accountDetails, paypalEmail: e.target.value }
              })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          Request Withdrawal
        </div>
      }
      size="lg"
      footer={
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="withdrawal-form"
            disabled={loading || formData.amount > availableBalance || formData.amount <= 0}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Request Withdrawal'}
          </button>
        </div>
      }
    >
      <form id="withdrawal-form" onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto overscroll-contain scroll-smooth modal-content-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            Available Balance: <span className="font-semibold">${availableBalance.toFixed(2)}</span>
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={availableBalance}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            {formData.amount > availableBalance && (
              <p className="mt-1 text-xs text-red-600">Amount cannot exceed available balance</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Withdrawal Method *
            </label>
            <select
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value, accountDetails: {} })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">Select method</option>
              <option value="bank">Bank Transfer</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>

          {formData.method && (
            <div className="space-y-3 pt-2 border-t border-gray-200">
              <h3 className="text-xs font-medium text-gray-700">Account Details</h3>
              {renderAccountFields()}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Any additional notes..."
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

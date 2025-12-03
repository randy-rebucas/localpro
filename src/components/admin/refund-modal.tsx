"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, DollarSign, AlertTriangle } from "lucide-react";
import { logger } from "@/lib/logger";

interface Transaction {
  id: string;
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  customer: string;
  date: string;
  reference: string;
}

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (refund: RefundData) => void;
  transaction?: Transaction;
}

export interface RefundData {
  amount: number;
  reason: string;
  notes?: string;
}

export function RefundModal({ isOpen, onClose, onSubmit, transaction }: RefundModalProps) {
  const [formData, setFormData] = useState<RefundData>({
    amount: transaction?.amount || 0,
    reason: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (formData.amount > (transaction?.amount || 0)) {
      newErrors.amount = 'Refund amount cannot exceed transaction amount';
    }

    if (!formData.reason) {
      newErrors.reason = 'Reason is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      await onSubmit(formData);
      setFormData({
        amount: 0,
        reason: '',
        notes: ''
      });
      setErrors({});
      onClose();
    } catch (error) {
      logger.error('Error processing refund', error instanceof Error ? error : new Error(String(error)), { transactionId: transaction?.id });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      amount: 0,
      reason: '',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-lg mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Process Refund
            </h2>
            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              className="p-1"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {transaction && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Transaction Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Reference:</span>
                  <span className="ml-2 font-medium">{transaction.reference}</span>
                </div>
                <div>
                  <span className="text-gray-500">Amount:</span>
                  <span className="ml-2 font-medium">₱{transaction.amount.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Method:</span>
                  <span className="ml-2 font-medium capitalize">{transaction.method.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-gray-500">Customer:</span>
                  <span className="ml-2 font-medium">{transaction.customer}</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Refund Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={transaction?.amount || 0}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.amount ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Refund Reason
              </label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.reason ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select reason</option>
                <option value="customer_request">Customer Request</option>
                <option value="duplicate_payment">Duplicate Payment</option>
                <option value="service_not_provided">Service Not Provided</option>
                <option value="defective_service">Defective Service</option>
                <option value="billing_error">Billing Error</option>
                <option value="fraudulent_transaction">Fraudulent Transaction</option>
                <option value="other">Other</option>
              </select>
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Any additional details about the refund..."
              />
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-orange-400 mr-3 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-orange-800">Important Notice</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    This refund will be processed immediately and cannot be undone. 
                    Please ensure all details are correct before proceeding.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {loading ? 'Processing...' : 'Process Refund'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

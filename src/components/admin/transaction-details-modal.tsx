"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Download, TrendingDown, Clock, CheckCircle, XCircle, CreditCard } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  customer: string;
  date: string;
  reference: string;
  description?: string;
  fee?: number;
  netAmount?: number;
}

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction;
  onRefund?: (transaction: Transaction) => void;
}

export function TransactionDetailsModal({ 
  isOpen, 
  onClose, 
  transaction, 
  onRefund 
}: TransactionDetailsModalProps) {
  if (!isOpen || !transaction) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'refunded':
        return <TrendingDown className="w-5 h-5 text-orange-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'paypal':
        return <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-sm font-bold">P</div>;
      case 'stripe':
        return <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center text-white text-sm font-bold">S</div>;
      case 'bank_transfer':
        return <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white text-sm font-bold">B</div>;
      case 'paymaya':
        return <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center text-white text-sm font-bold">M</div>;
      default:
        return <CreditCard className="w-8 h-8 text-gray-600" />;
    }
  };

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleDownloadReceipt = () => {
    // Implement receipt download
    console.log('Download receipt for transaction:', transaction.id);
  };

  const handleRefund = () => {
    onRefund?.(transaction);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Transaction Details</h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="p-1"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Transaction Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                {getMethodIcon(transaction.method)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {transaction.reference}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {transaction.description || 'Payment transaction'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {formatAmount(transaction.amount)}
                </div>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                  <div className="flex items-center">
                    {getStatusIcon(transaction.status)}
                    <span className="ml-1 capitalize">{transaction.status}</span>
                  </div>
                </span>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Transaction Information</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-500">Transaction ID</span>
                    <span className="text-sm text-gray-900 font-mono">{transaction.id}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-500">Reference</span>
                    <span className="text-sm text-gray-900">{transaction.reference}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-500">Amount</span>
                    <span className="text-sm text-gray-900 font-semibold">{formatAmount(transaction.amount)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-500">Payment Method</span>
                    <span className="text-sm text-gray-900 capitalize">{transaction.method.replace('_', ' ')}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-500">Status</span>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-500">Date</span>
                    <span className="text-sm text-gray-900">{formatDate(transaction.date)}</span>
                  </div>
                  
                  {transaction.fee && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-500">Processing Fees</span>
                      <span className="text-sm text-gray-900">{formatAmount(transaction.fee)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Customer Information</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-500">Customer Name</span>
                    <span className="text-sm text-gray-900">{transaction.customer}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-500">Customer ID</span>
                    <span className="text-sm text-gray-900 font-mono">CUST-{transaction.id.slice(-6)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-500">Email</span>
                    <span className="text-sm text-gray-900">{transaction.customer || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-500">Phone</span>
                    <span className="text-sm text-gray-900">N/A</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-2">
              <h4 className="text-lg font-medium text-gray-900">Notes</h4>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">No additional notes available for this transaction.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={handleDownloadReceipt}
                  className="flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Close
                </Button>
                {transaction.status === 'completed' && (
                  <Button
                    onClick={handleRefund}
                    className="bg-orange-600 hover:bg-orange-700 flex items-center"
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Process Refund
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

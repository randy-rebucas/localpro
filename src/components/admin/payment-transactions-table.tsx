"use client";

import { Table, THead, TBody, Tr, Th, Td, TableEmptyRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { 
  CreditCard, 
  Eye, 
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  TrendingDown
} from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  customer: string;
  date: string;
  reference: string;
  description?: string;
  fees?: number;
}

interface PaymentTransactionsTableProps {
  transactions: Transaction[];
  loading?: boolean;
  onViewTransaction?: (transaction: Transaction) => void;
  onRefundTransaction?: (transaction: Transaction) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function PaymentTransactionsTable({
  transactions,
  loading = false,
  onViewTransaction,
  onRefundTransaction,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = ""
}: PaymentTransactionsTableProps) {

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'refunded':
        return <TrendingDown className="w-4 h-4 text-orange-600" />;
      default:
        return <CreditCard className="w-4 h-4 text-gray-600" />;
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
        return <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">P</div>;
      case 'stripe':
        return <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">S</div>;
      case 'bank_transfer':
        return <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">B</div>;
      case 'paymaya':
        return <div className="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center text-white text-xs font-bold">M</div>;
      default:
        return <CreditCard className="w-6 h-6 text-gray-600" />;
    }
  };

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRefund = (transaction: Transaction) => {
    if (transaction.status === 'completed') {
      onRefundTransaction?.(transaction);
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Payment Transactions</h3>
        <p className="text-sm text-gray-600 mt-1">
          {transactions.length} transactions found
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <THead>
            <Tr>
              <Th>Transaction</Th>
              <Th>Customer</Th>
              <Th>Method</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Date</Th>
              <Th>Actions</Th>
            </Tr>
          </THead>
          <TBody>
            {transactions.length === 0 ? (
              <TableEmptyRow colSpan={7}>
                <EmptyState
                  title="No transactions"
                  description="Payment transactions will appear here when available."
                  icon={CreditCard}
                  iconColor="text-gray-400"
                />
              </TableEmptyRow>
            ) : (
              transactions.map((transaction) => (
                <Tr key={transaction.id}>
                  <Td>
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                          {getMethodIcon(transaction.method)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-700">
                          {transaction.reference}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transaction.description || 'Payment transaction'}
                        </div>
                        {transaction.fees && (
                          <div className="text-xs text-gray-400">
                            Fees: ${transaction.fees.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="text-sm font-medium text-gray-700">
                      {transaction.customer}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center">
                      {getMethodIcon(transaction.method)}
                      <span className="ml-2 text-sm font-medium text-gray-700 capitalize">
                        {transaction.method.replace('_', ' ')}
                      </span>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatAmount(transaction.amount)}
                    </span>
                  </Td>
                  <Td>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      <div className="flex items-center">
                        {getStatusIcon(transaction.status)}
                        <span className="ml-1 capitalize">{transaction.status}</span>
                      </div>
                    </span>
                  </Td>
                  <Td>
                    <div className="text-sm text-gray-700">
                      {formatDate(transaction.date)}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewTransaction?.(transaction)}
                        className="p-1"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {transaction.status === 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRefund(transaction)}
                          className="p-1 text-orange-600 hover:text-orange-800"
                        >
                          <TrendingDown className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </TBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

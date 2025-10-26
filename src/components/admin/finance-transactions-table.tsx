"use client";

import { Table, THead, TBody, Tr, Th, Td, TableEmptyRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { 
  CreditCard, 
  Eye, 
  Download, 
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  DollarSign
} from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  reference: string;
  type: 'revenue' | 'expense' | 'withdrawal';
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  category?: string;
}

interface FinanceTransactionsTableProps {
  transactions: Transaction[];
  loading?: boolean;
  onViewTransaction?: (transaction: Transaction) => void;
  onDownloadReceipt?: (transaction: Transaction) => void;
  className?: string;
}

export function FinanceTransactionsTable({
  transactions,
  loading = false,
  onViewTransaction,
  onDownloadReceipt,
  className = ""
}: FinanceTransactionsTableProps) {

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'revenue':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'expense':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'withdrawal':
        return <DollarSign className="w-4 h-4 text-blue-600" />;
      default:
        return <CreditCard className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'revenue':
        return 'bg-green-100 text-green-800';
      case 'expense':
        return 'bg-red-100 text-red-800';
      case 'withdrawal':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const prefix = type === 'revenue' ? '+' : type === 'expense' ? '-' : '-';
    return `${prefix}$${Math.abs(amount).toFixed(2)}`;
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
        <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        <p className="text-sm text-gray-600 mt-1">
          {transactions.length} transactions found
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <THead>
            <Tr>
              <Th>Transaction</Th>
              <Th>Type</Th>
              <Th>Amount</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </THead>
          <TBody>
            {transactions.length === 0 ? (
              <TableEmptyRow colSpan={6}>
                <EmptyState
                  title="No transactions"
                  description="Transactions will appear here when available."
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
                          {getTypeIcon(transaction.type)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-700">
                          {transaction.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transaction.reference}
                        </div>
                        {transaction.category && (
                          <div className="text-xs text-gray-400">
                            {transaction.category}
                          </div>
                        )}
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(transaction.type)}`}>
                      {transaction.type}
                    </span>
                  </Td>
                  <Td>
                    <span className={`font-medium ${
                      transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatAmount(transaction.amount, transaction.type)}
                    </span>
                  </Td>
                  <Td>
                    <div className="text-sm text-gray-700">
                      {new Date(transaction.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(transaction.date).toLocaleTimeString()}
                    </div>
                  </Td>
                  <Td>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadReceipt?.(transaction)}
                        className="p-1"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
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
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useTransactions } from "@/features/finance/hooks";
import { FinanceTransactionsTable } from "@/components/admin/finance-transactions-table";
import { TransactionDetailsModal } from "@/components/admin/transaction-details-modal";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCSV, formatTableData } from "@/features/admin/lib/admin-utils";

interface TransactionHistoryProps {
  userId?: string;
  type?: string;
  status?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

export function TransactionHistory({
  type,
  status,
  category,
  startDate,
  endDate,
}: TransactionHistoryProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const { transactions, loading, error, pagination } = useTransactions({
    type,
    status,
    category,
    startDate,
    endDate,
    page,
    limit: pageSize,
  });

  const formattedTransactions = transactions.map((t): {
    id: string;
    description: string;
    reference: string;
    type: "revenue" | "expense";
    amount: number;
    date: string;
    status: "completed" | "pending" | "failed";
    category: string;
    // For TransactionDetailsModal
    method: string;
    customer: string;
    fee: number;
    netAmount: number;
  } => ({
    id: t._id || t.reference || "",
    description: t.description || "",
    reference: t.reference || "",
    type: t.direction === "inbound" ? ("revenue" as const) : ("expense" as const),
    amount: t.amount || 0,
    date: t.createdAt?.toISOString() || new Date().toISOString(),
    status: t.status === "completed" ? ("completed" as const) : t.status === "pending" ? ("pending" as const) : ("failed" as const),
    category: t.type || "",
    method: t.paymentMethod || "unknown",
    customer: "User", // Would need to fetch user info
    fee: 0, // Would need to calculate
    netAmount: t.amount || 0,
  }));

  const handleExport = () => {
    const exportData = formatTableData(transactions, [
      { key: "reference", label: "Reference" },
      { key: "description", label: "Description" },
      { key: "type", label: "Type" },
      { key: "amount", label: "Amount", format: (v) => `$${Number(v).toFixed(2)}` },
      { key: "status", label: "Status" },
      { key: "createdAt", label: "Date", format: (v) => v ? new Date(v as string).toLocaleDateString() : "" },
    ]);
    exportToCSV(exportData, `transactions-${new Date().toISOString().split("T")[0]}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading transactions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Error loading transactions: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Transaction History</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <FinanceTransactionsTable
        transactions={formattedTransactions}
        loading={loading}
        onViewTransaction={(transaction) => setSelectedTransaction(transaction.id)}
      />

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((pagination.current - 1) * pageSize) + 1} to {Math.min(pagination.current * pageSize, pagination.total)} of {pagination.total} transactions
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={pagination.current <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={pagination.current >= pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <TransactionDetailsModal
          isOpen={!!selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          transaction={formattedTransactions.find(t => t.id === selectedTransaction)}
          formatAmount={(amount) => `$${amount.toFixed(2)}`}
        />
      )}
    </div>
  );
}


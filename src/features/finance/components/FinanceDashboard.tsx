"use client";

import { useFinance, useFinanceOverview } from "@/features/finance/hooks";
import { FinanceStatsCard } from "@/components/admin/finance-stats-card";
import { FinanceTransactionsTable } from "@/components/admin/finance-transactions-table";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { formatAdminCurrency, calculateGrowth } from "@/features/admin/lib/admin-utils";

interface FinanceDashboardProps {
  timeframe?: "day" | "week" | "month" | "year";
  startDate?: string;
  endDate?: string;
}

export function FinanceDashboard({ timeframe = "month", startDate, endDate }: FinanceDashboardProps) {
  const { finance, loading: financeLoading, error: financeError } = useFinance({
    startDate,
    endDate,
    period: timeframe,
  });

  const { overview, loading: overviewLoading, error: overviewError } = useFinanceOverview({
    startDate,
    endDate,
    period: timeframe,
  });

  if (financeLoading || overviewLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading finance data...</div>
      </div>
    );
  }

  if (financeError || overviewError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Error loading finance data</div>
      </div>
    );
  }

  const totalEarnings = overview?.totalEarnings ?? 0;
  const totalExpenses = overview?.totalExpenses ?? 0;
  const netIncome = overview?.netIncome ?? 0;
  const availableBalance = overview?.availableBalance ?? 0;

  // Calculate growth (would need previous period data)
  const earningsGrowth = calculateGrowth(totalEarnings, totalEarnings * 0.9); // Placeholder
  const expensesGrowth = calculateGrowth(totalExpenses, totalExpenses * 0.9); // Placeholder

  const transactions = finance?.transactions?.map((t) => ({
    id: t.reference || "",
    description: t.description || "",
    reference: t.reference || "",
    type: t.type === "income" ? ("revenue" as const) : ("expense" as const),
    amount: t.amount || 0,
    date: t.timestamp?.toISOString() || new Date().toISOString(),
    status: t.status === "completed" ? ("completed" as const) : ("pending" as const),
    category: t.category || "",
  })) || [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinanceStatsCard
          title="Total Earnings"
          value={formatAdminCurrency(totalEarnings)}
          change={`${earningsGrowth.trend === "up" ? "+" : ""}${earningsGrowth.percentage.toFixed(1)}%`}
          changeType={earningsGrowth.trend === "up" ? "positive" : "negative"}
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
        <FinanceStatsCard
          title="Total Expenses"
          value={formatAdminCurrency(totalExpenses)}
          change={`${expensesGrowth.trend === "up" ? "+" : ""}${expensesGrowth.percentage.toFixed(1)}%`}
          changeType={expensesGrowth.trend === "up" ? "negative" : "positive"}
          icon={TrendingDown}
          iconColor="text-red-600"
          iconBg="bg-red-100"
        />
        <FinanceStatsCard
          title="Net Income"
          value={formatAdminCurrency(netIncome)}
          change={`${netIncome >= 0 ? "+" : ""}${((netIncome / totalEarnings) * 100).toFixed(1)}%`}
          changeType={netIncome >= 0 ? "positive" : "negative"}
          icon={DollarSign}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <FinanceStatsCard
          title="Available Balance"
          value={formatAdminCurrency(availableBalance)}
          icon={Wallet}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
      </div>

      {/* Transactions Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <FinanceTransactionsTable
          transactions={transactions}
          loading={financeLoading}
        />
      </div>
    </div>
  );
}


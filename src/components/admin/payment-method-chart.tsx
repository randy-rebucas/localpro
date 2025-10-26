"use client";

import { memo } from "react";
import { Card } from "@/components/ui/card";

interface PaymentMethodData {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

interface PaymentMethodChartProps {
  data: PaymentMethodData[];
  title: string;
  className?: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export const PaymentMethodChart = memo(function PaymentMethodChart({ data, title, className = "" }: PaymentMethodChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center text-gray-500 py-8">
          No payment method data available.
        </div>
      </Card>
    );
  }

  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      {/* Simple bar chart representation */}
      <div className="space-y-4 mb-6">
        {data.map((item, index) => (
          <div key={item.method} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700 capitalize">
                {item.method.replace('_', ' ')}
              </span>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  ${item.amount.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  {item.count} transactions ({item.percentage.toFixed(1)}%)
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: COLORS[index % COLORS.length]
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.map((item, index) => (
          <div key={item.method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-3" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm font-medium text-gray-700 capitalize">
                {item.method.replace('_', ' ')}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                ${item.amount.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                {item.percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Total</span>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              ${totalAmount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {totalCount} transactions
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
});
"use client";

import { memo } from "react";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface PaymentStatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  className?: string;
}

export const PaymentStatsCard = memo(function PaymentStatsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor,
  iconBg,
  className = ""
}: PaymentStatsCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return '↗';
      case 'negative':
        return '↘';
      default:
        return '';
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center">
        <div className={`p-3 ${iconBg} rounded-lg`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className="flex items-center mt-1">
              <span className={`text-sm font-medium ${getChangeColor()}`}>
                {getChangeIcon()} {change}
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last period</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});

"use client";

import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FinanceStatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  className?: string;
}

export function FinanceStatsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor,
  iconBg,
  className = ""
}: FinanceStatsCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-accent';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center">
        <div className={`p-2 ${iconBg} rounded-lg`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-700">{value}</p>
          {change && (
            <p className={`text-xs ${getChangeColor()}`}>
              {change}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

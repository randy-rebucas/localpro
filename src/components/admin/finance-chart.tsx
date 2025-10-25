"use client";

import { Card } from "@/components/ui/card";
import { BarChart3, PieChart, TrendingUp, TrendingDown } from "lucide-react";

interface FinanceChartProps {
  title: string;
  type: 'bar' | 'pie' | 'line';
  data: any[];
  className?: string;
  height?: string;
}

export function FinanceChart({ 
  title, 
  type, 
  data, 
  className = "",
  height = "h-64"
}: FinanceChartProps) {
  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <div className={`${height} flex items-center justify-center bg-gray-50 rounded-lg`}>
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Bar chart will be displayed here</p>
              <p className="text-sm text-gray-400 mt-1">Data points: {data.length}</p>
            </div>
          </div>
        );
      case 'pie':
        return (
          <div className={`${height} flex items-center justify-center bg-gray-50 rounded-lg`}>
            <div className="text-center">
              <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Pie chart will be displayed here</p>
              <p className="text-sm text-gray-400 mt-1">Data points: {data.length}</p>
            </div>
          </div>
        );
      case 'line':
        return (
          <div className={`${height} flex items-center justify-center bg-gray-50 rounded-lg`}>
            <div className="text-center">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Line chart will be displayed here</p>
              <p className="text-sm text-gray-400 mt-1">Data points: {data.length}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
      {renderChart()}
    </Card>
  );
}

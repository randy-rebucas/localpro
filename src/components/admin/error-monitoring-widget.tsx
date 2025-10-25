"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  XCircle, 
  AlertCircle, 
  CheckCircle,
  Activity
} from "lucide-react";

interface ErrorStats {
  total: number;
  critical: number;
  errors: number;
  warnings: number;
  resolved: number;
  unresolved: number;
  todayCount: number;
  weekCount: number;
}

interface ErrorMonitoringWidgetProps {
  className?: string;
}

export function ErrorMonitoringWidget({ className = "" }: ErrorMonitoringWidgetProps) {
  const [stats, setStats] = useState<ErrorStats>({
    total: 0,
    critical: 0,
    errors: 0,
    warnings: 0,
    resolved: 0,
    unresolved: 0,
    todayCount: 0,
    weekCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchErrorStats();
  }, []);

  const fetchErrorStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/error-monitoring/dashboard/summary');
      
      if (!response.ok) {
        throw new Error('Failed to fetch error stats');
      }
      
      const data = await response.json();
      if (data.success) {
        const summary = data.data;
        setStats({
          total: summary.totalErrors,
          critical: summary.criticalErrors,
          errors: summary.totalErrors - summary.criticalErrors,
          warnings: 0, // Not provided in summary
          resolved: summary.totalErrors - summary.unresolvedErrors,
          unresolved: summary.unresolvedErrors,
          todayCount: summary.todayErrors,
          weekCount: summary.weekErrors
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load error stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow border ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow border ${className}`}>
        <div className="text-center text-red-600">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>Failed to load error monitoring data</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (count: number, threshold: number = 5) => {
    if (count === 0) return 'text-green-600';
    if (count <= threshold) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (count: number, threshold: number = 5) => {
    if (count === 0) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (count <= threshold) return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow border ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Error Monitoring</h3>
            <p className="text-sm text-gray-600">System health overview</p>
          </div>
        </div>
        <Link
          href="/admin/errors"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View Details →
        </Link>
      </div>

      {/* Critical Alerts */}
      {stats.critical > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-sm font-medium text-red-800">
              {stats.critical} Critical Error{stats.critical !== 1 ? 's' : ''} Require{stats.critical === 1 ? 's' : ''} Immediate Attention
            </span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            {getStatusIcon(stats.unresolved)}
            <span className={`ml-1 text-lg font-bold ${getStatusColor(stats.unresolved)}`}>
              {stats.unresolved}
            </span>
          </div>
          <p className="text-xs text-gray-600">Unresolved</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="ml-1 text-lg font-bold text-blue-600">
              {stats.todayCount}
            </span>
          </div>
          <p className="text-xs text-gray-600">Today</p>
        </div>
      </div>

      {/* Error Breakdown */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-gray-700">Critical</span>
          </div>
          <span className={`font-medium ${getStatusColor(stats.critical)}`}>
            {stats.critical}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-gray-700">Errors</span>
          </div>
          <span className={`font-medium ${getStatusColor(stats.errors)}`}>
            {stats.errors}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
            <span className="text-gray-700">Warnings</span>
          </div>
          <span className={`font-medium ${getStatusColor(stats.warnings)}`}>
            {stats.warnings}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <Link
            href="/admin/errors"
            className="flex-1 text-center px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
          >
            View All Errors
          </Link>
          <Link
            href="/admin/errors"
            className="flex-1 text-center px-3 py-2 text-sm bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            Critical Only
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Lazy Loading Utilities using next/dynamic
 * 
 * This file centralizes lazy-loaded components using Next.js dynamic imports.
 * Following Next.js best practices: https://nextjs.org/docs/app/guides/lazy-loading
 */

import React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Loading fallback components
const ChartSkeleton = () => (
  <div className="h-64 bg-slate-800 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 bg-slate-700 rounded mx-auto mb-2"></div>
      <p className="text-sm text-slate-400">Loading chart...</p>
    </div>
  </div>
);

const ModalSkeleton = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 w-full max-w-md animate-pulse">
      <div className="h-6 bg-slate-800 rounded w-3/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-slate-800 rounded"></div>
        <div className="h-4 bg-slate-800 rounded w-5/6"></div>
      </div>
    </div>
  </div>
);

const TableSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
);

// ============================================
// Chart Components (Heavy - recharts library)
// ============================================

/**
 * Lazy-loaded Payment Method Chart
 * Only loads when needed, reduces initial bundle size
 */
export const LazyPaymentMethodChart = dynamic(
  () => import('@/components/admin/payment-method-chart').then((mod) => ({
    default: mod.PaymentMethodChart
  })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Charts don't need SSR
  }
);

/**
 * Lazy-loaded Finance Chart
 */
export const LazyFinanceChart = dynamic(
  () => import('@/components/admin/finance-chart').then((mod) => ({
    default: mod.FinanceChart
  })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// ============================================
// Modal Components (Load on demand)
// ============================================

/**
 * Lazy-loaded Refund Modal
 * Only loads when user clicks refund button
 */
export const LazyRefundModal = dynamic(
  () => import('@/components/admin/refund-modal').then((mod) => ({
    default: mod.RefundModal
  })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false, // Modals are client-side only
  }
);

/**
 * Lazy-loaded Transaction Details Modal
 */
export const LazyTransactionDetailsModal = dynamic(
  () => import('@/components/admin/transaction-details-modal').then((mod) => ({
    default: mod.TransactionDetailsModal
  })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);

/**
 * Lazy-loaded Add Expense Modal
 */
export const LazyAddExpenseModal = dynamic(
  () => import('@/components/admin/add-expense-modal').then((mod) => ({
    default: mod.AddExpenseModal
  })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);

/**
 * Lazy-loaded Withdrawal Request Modal
 */
export const LazyWithdrawalRequestModal = dynamic(
  () => import('@/components/admin/withdrawal-request-modal').then((mod) => ({
    default: mod.WithdrawalRequestModal
  })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);

/**
 * Lazy-loaded Preferred Feature Modal
 */
export const LazyPreferredFeatureModal = dynamic(
  () => import('@/components/preferred-feature-modal').then((mod) => ({
    default: mod.PreferredFeatureModal
  })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);

/**
 * Lazy-loaded Verification Modal
 */
export const LazyVerificationModal = dynamic(
  () => import('@/components/verification-modal').then((mod) => ({
    default: mod.VerificationModal
  })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);

// ============================================
// AI Components (Heavy - Load on demand)
// ============================================

/**
 * Lazy-loaded AI Service Recommendations
 * Only loads when user enables AI features
 */
export const LazyAIServiceRecommendations = dynamic(
  () => import('@/components/marketplace/ai-service-recommendations').then((mod) => ({
    default: mod.AIServiceRecommendations
  })),
  {
    loading: () => <div className="h-64 bg-slate-800 rounded-lg animate-pulse" />,
    ssr: false,
  }
);

/**
 * Lazy-loaded AI Service Matcher
 */
export const LazyAIServiceMatcher = dynamic(
  () => import('@/components/marketplace/ai-service-matcher').then((mod) => ({
    default: mod.AIServiceMatcher
  })),
  {
    loading: () => <div className="h-64 bg-slate-800 rounded-lg animate-pulse" />,
    ssr: false,
  }
);

/**
 * Lazy-loaded AI Price Estimator
 */
export const LazyAIPriceEstimator = dynamic(
  () => import('@/components/marketplace/ai-price-estimator').then((mod) => ({
    default: mod.AIPriceEstimator
  })),
  {
    loading: () => <div className="h-32 bg-slate-800 rounded-lg animate-pulse" />,
    ssr: false,
  }
);

/**
 * Lazy-loaded AI Natural Language Search
 */
export const LazyAINaturalLanguageSearch = dynamic(
  () => import('@/components/marketplace/ai-natural-language-search').then((mod) => ({
    default: mod.AINaturalLanguageSearch
  })),
  {
    loading: () => <div className="h-20 bg-slate-800 rounded-lg animate-pulse" />,
    ssr: false,
  }
);

// ============================================
// Heavy Table Components
// ============================================

/**
 * Lazy-loaded Payment Transactions Table
 * Heavy component with sorting and filtering
 */
export const LazyPaymentTransactionsTable = dynamic(
  () => import('@/components/admin/payment-transactions-table').then((mod) => ({
    default: mod.PaymentTransactionsTable
  })),
  {
    loading: () => <TableSkeleton />,
  }
);

// ============================================
// File Upload & Gallery Components
// ============================================

/**
 * Lazy-loaded Portfolio Gallery
 * Heavy component with image handling
 */
export const LazyPortfolioGallery = dynamic(
  () => import('@/components/portfolio-gallery').then((mod) => ({
    default: mod.PortfolioGallery
  })),
  {
    loading: () => (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square bg-slate-800 rounded-lg animate-pulse" />
        ))}
      </div>
    ),
    ssr: false,
  }
);

/**
 * Lazy-loaded File Upload Component
 * Only loads when user needs to upload files
 */
export const LazyFileUpload = dynamic(
  () => import('@/components/ui/file-upload').then((mod) => ({
    default: mod.FileUpload
  })),
  {
    loading: () => (
      <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 animate-pulse">
        <div className="h-12 bg-slate-800 rounded w-3/4 mx-auto mb-4"></div>
        <div className="h-8 bg-slate-800 rounded w-1/2 mx-auto"></div>
      </div>
    ),
    ssr: false,
  }
);

// ============================================
// Below-the-Fold Components (Intersection Observer)
// ============================================

/**
 * Lazy-loaded Marketplace Footer
 * Loads when user scrolls near footer
 */
export const LazyMarketplaceFooter = dynamic(
  () => import('@/components/marketplace/marketplace-footer').then((mod) => ({
    default: mod.MarketplaceFooter
  })),
  {
    loading: () => (
      <footer className="bg-slate-900 border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-5 bg-slate-800 rounded w-24 animate-pulse"></div>
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-4 bg-slate-800 rounded w-32 animate-pulse"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    ),
  }
);

/**
 * Lazy-loaded Portfolio Gallery
 * Already defined above, but can be used with intersection observer
 */

// ============================================
// Heavy Admin Components
// ============================================

/**
 * Lazy-loaded Admin Error State
 */
export const LazyAdminErrorState = dynamic(
  () => import('@/components/admin/admin-error-state').then((mod) => ({
    default: mod.AdminErrorState
  })),
  {
    loading: () => <Skeleton className="h-32 w-full" />,
  }
);

/**
 * Lazy-loaded Admin Sidebar
 */
export const LazyAdminSidebar = dynamic(
  () => import('@/components/admin/admin-sidebar').then((mod) => ({
    default: mod.AdminSidebar
  })),
  {
    loading: () => (
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl border-r border-gray-200">
        <div className="p-3 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    ),
    ssr: false,
  }
);


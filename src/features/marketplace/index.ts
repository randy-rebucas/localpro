/**
 * Marketplace Feature
 * 
 * This feature module handles:
 * - Service listings and management
 * - Provider profiles
 * - Bookings
 * - Service categories
 */

// Components will be exported here
export * from './components';

// Hooks
export * from './hooks';

// Note: avoid wildcard re-exporting marketplace types here to prevent export name collisions
// with component names (e.g. `BusinessInfo`). Import types directly from:
// - `src/features/marketplace/types.ts`
// - `src/features/marketplace/types-providers.ts`
// - `src/features/marketplace/types-bookings.ts`

// Utilities will be exported here
// (No marketplace lib exports yet)


/**
 * Authentication & User Management Feature
 * 
 * This feature module handles:
 * - User authentication (phone-based)
 * - User profile management
 * - Session management
 * - Token validation
 */

// Components will be exported here
export * from './components';

// Hooks
export * from './hooks';

// Note: avoid wildcard re-exporting types here to prevent name collisions with hooks/components.
// Import types directly from `src/features/auth/types.ts` if needed.

// Utilities will be exported here
export * from './lib';


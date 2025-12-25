/**
 * Communication Hooks
 */
export type { ConversationsParams } from './useCommunication';
export { useConversations, useMessages } from './useCommunication';
// Keep legacy notifications hook available without colliding with the main `useNotifications` export.
export { useNotifications as useCommunicationNotifications } from './useCommunication';

export * from './useNotifications';


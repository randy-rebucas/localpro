export { LiveChatProvider, useLiveChat } from "./LiveChatContext";
export type { 
  ChatMessage, 
  ChatUser, 
  ChatAttachment, 
  ChatSession, 
  AssignedAgent, 
  ChatRating 
} from "./LiveChatContext";
export { LiveChatWidget } from "./LiveChatWidget";
export { LiveChatWrapper } from "./LiveChatWrapper";

// API exports for integration
export * as LiveChatAPI from "./live-chat-api";
export { liveChatWS } from "./live-chat-api";

// Demo bridge for testing without backend
export * as DemoBridge from "./demo-bridge";

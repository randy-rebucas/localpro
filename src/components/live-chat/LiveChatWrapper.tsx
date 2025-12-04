"use client";

import { LiveChatProvider } from "./LiveChatContext";
import { LiveChatWidget } from "./LiveChatWidget";

/**
 * LiveChatWrapper - Wraps the chat provider and widget for use in layouts
 * 
 * This component provides the live chat functionality across the entire application.
 * It includes:
 * - A floating chat button in the bottom-right corner
 * - A chat window with message history
 * - User info collection form
 * - Quick action buttons
 * - Typing indicators and read receipts
 * 
 * Usage: Add this component to your root layout to enable live chat site-wide.
 */
export function LiveChatWrapper() {
  return (
    <LiveChatProvider>
      <LiveChatWidget />
    </LiveChatProvider>
  );
}


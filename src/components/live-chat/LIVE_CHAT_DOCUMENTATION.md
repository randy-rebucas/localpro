# LocalPro Live Chat - Admin Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Current Implementation](#current-implementation)
4. [Managing Conversations](#managing-conversations)
5. [Backend Integration Guide](#backend-integration-guide)
6. [Admin Dashboard Implementation](#admin-dashboard-implementation)
7. [API Endpoints](#api-endpoints)
8. [WebSocket Integration](#websocket-integration)
9. [Database Schema](#database-schema)
10. [Customization](#customization)

---

## Overview

The LocalPro Live Chat system provides real-time customer support functionality with:
- **Floating chat widget** on all pages
- **User information collection** (name, email)
- **File attachments** (images, PDFs, documents up to 10MB)
- **Emoji picker** for quick reactions
- **Session management** with unique session IDs
- **Typing indicators** and read receipts
- **Minimized state** with unread message count

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Frontend)                        │
├─────────────────────────────────────────────────────────────┤
│  LiveChatProvider (Context)                                  │
│  ├── State Management (messages, user, session)              │
│  ├── Message Handling                                        │
│  └── Attachment Processing                                   │
│                                                              │
│  LiveChatWidget (UI)                                         │
│  ├── Chat Window                                             │
│  ├── Emoji Picker                                            │
│  ├── File Upload                                             │
│  └── Floating Button                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket / REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Server (Backend)                         │
├─────────────────────────────────────────────────────────────┤
│  Chat Service                                                │
│  ├── Session Management                                      │
│  ├── Message Storage                                         │
│  ├── File Upload Handler                                     │
│  └── Agent Assignment                                        │
│                                                              │
│  Admin Dashboard                                             │
│  ├── Conversation List                                       │
│  ├── Real-time Chat Interface                                │
│  ├── Customer History                                        │
│  └── Analytics                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Current Implementation

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `LiveChatProvider` | `LiveChatContext.tsx` | State management & business logic |
| `LiveChatWidget` | `LiveChatWidget.tsx` | UI component with chat window |
| `LiveChatWrapper` | `LiveChatWrapper.tsx` | Layout integration wrapper |

### Key Types

```typescript
interface ChatMessage {
  id: string;
  type: "user" | "agent" | "system";
  content: string;
  timestamp: Date;
  agentName?: string;
  agentAvatar?: string;
  attachments?: ChatAttachment[];
}

interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  previewUrl?: string;
}

interface ChatUser {
  name: string;
  email: string;
  phone?: string;
}

interface ChatSession {
  id: string;
  user: ChatUser;
  messages: ChatMessage[];
  startedAt: Date;
  status: "active" | "closed" | "pending";
  assignedAgent?: string;
}
```

### Current Features

- ✅ User info collection form
- ✅ Real-time messaging
- ✅ Emoji picker (24 common emojis)
- ✅ File attachments (images, PDFs, docs)
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Minimize/maximize
- ✅ Unread message badges
- ✅ Session ID generation
- ⚠️ Demo mode with simulated responses

---

## Managing Conversations

### Session Tracking

Each chat session is assigned a unique ID when the user submits their info:

```typescript
// Session ID format: session-{timestamp}-{random}
// Example: session-1701691234567-abc123xyz
```

Sessions are logged to the console in development:

```javascript
console.log('[LiveChat] Session started:', {
  sessionId: 'session-1701691234567-abc123xyz',
  user: { name: 'John Doe', email: 'john@example.com' },
  timestamp: '2024-12-04T12:00:00.000Z',
});
```

### Message Flow

1. **User sends message** → `sendMessage(content, attachments?)`
2. **Message added to state** → Displayed in chat window
3. **Agent typing indicator** → Shows while processing
4. **Agent response** → Currently simulated, replace with API call

---

## Backend Integration Guide

### Step 1: Create API Endpoints

Replace the simulated responses in `LiveChatContext.tsx`:

```typescript
// In sendMessage function, replace setTimeout simulation with:

const sendMessage = useCallback(async (content: string, attachments?: ChatAttachment[]) => {
  if (!content.trim() && (!attachments || attachments.length === 0)) return;

  const userMessage: ChatMessage = {
    id: `user-${Date.now()}`,
    type: "user",
    content: content.trim(),
    timestamp: new Date(),
    attachments,
  };

  setMessages((prev) => [...prev, userMessage]);

  // Send to backend
  try {
    const response = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        message: userMessage,
        user,
      }),
    });

    if (!response.ok) throw new Error('Failed to send message');
    
    // Response will come via WebSocket
  } catch (error) {
    console.error('Failed to send message:', error);
    // Show error to user
  }
}, [sessionId, user]);
```

### Step 2: WebSocket Connection

Add WebSocket for real-time updates:

```typescript
// In LiveChatProvider
useEffect(() => {
  if (!sessionId) return;

  const ws = new WebSocket(`wss://your-api.com/chat/${sessionId}`);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
      case 'agent_message':
        setMessages((prev) => [...prev, data.message]);
        if (!isOpen || isMinimized) {
          setUnreadCount((prev) => prev + 1);
        }
        break;
      case 'agent_typing':
        setIsTyping(data.isTyping);
        break;
      case 'session_ended':
        // Handle session end
        break;
    }
  };

  return () => ws.close();
}, [sessionId, isOpen, isMinimized]);
```

### Step 3: File Upload

Replace blob URLs with server upload:

```typescript
const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files) return;

  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append('files', file);
  });
  formData.append('sessionId', sessionId);

  try {
    const response = await fetch('/api/chat/upload', {
      method: 'POST',
      body: formData,
    });

    const { attachments } = await response.json();
    setAttachments((prev) => [...prev, ...attachments]);
  } catch (error) {
    setAttachmentError('Failed to upload files');
  }
};
```

---

## Admin Dashboard Implementation

### Required Pages

Create these pages in your admin section:

```
/admin/chat/
├── page.tsx           # Conversation list
├── [sessionId]/
│   └── page.tsx       # Individual chat view
└── settings/
    └── page.tsx       # Chat settings
```

### Conversation List Component

```tsx
// /admin/chat/page.tsx
'use client';

import { useState, useEffect } from 'react';

interface ChatSession {
  id: string;
  user: { name: string; email: string };
  lastMessage: string;
  unreadCount: number;
  status: 'active' | 'pending' | 'closed';
  startedAt: Date;
}

export default function AdminChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'pending'>('all');

  useEffect(() => {
    // Fetch active sessions
    fetchSessions();
    
    // Subscribe to new sessions via WebSocket
    const ws = new WebSocket('wss://your-api.com/admin/chat');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_session') {
        setSessions((prev) => [data.session, ...prev]);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Live Chat</h1>
      
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'active', 'pending'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg ${
              filter === f ? 'bg-emerald-500 text-white' : 'bg-slate-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Session list */}
      <div className="space-y-2">
        {sessions
          .filter((s) => filter === 'all' || s.status === filter)
          .map((session) => (
            <a
              key={session.id}
              href={`/admin/chat/${session.id}`}
              className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{session.user.name}</h3>
                  <p className="text-sm text-gray-500">{session.user.email}</p>
                  <p className="text-sm text-gray-600 mt-1 truncate max-w-md">
                    {session.lastMessage}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    session.status === 'active' ? 'bg-green-100 text-green-800' :
                    session.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {session.status}
                  </span>
                  {session.unreadCount > 0 && (
                    <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                      {session.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </a>
          ))}
      </div>
    </div>
  );
}
```

### Agent Chat Interface

```tsx
// /admin/chat/[sessionId]/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip } from 'lucide-react';

export default function AdminChatSession({ params }: { params: { sessionId: string } }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [session, setSession] = useState<ChatSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load session and messages
    loadSession(params.sessionId);
    
    // Connect to WebSocket for real-time updates
    const ws = new WebSocket(`wss://your-api.com/admin/chat/${params.sessionId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'user_message') {
        setMessages((prev) => [...prev, data.message]);
      }
    };

    return () => ws.close();
  }, [params.sessionId]);

  const sendReply = async () => {
    if (!input.trim()) return;

    const message: ChatMessage = {
      id: `agent-${Date.now()}`,
      type: 'agent',
      content: input,
      timestamp: new Date(),
      agentName: 'You', // Replace with actual agent name
      agentAvatar: 'A',
    };

    // Optimistically add to UI
    setMessages((prev) => [...prev, message]);
    setInput('');

    // Send to backend
    await fetch(`/api/admin/chat/${params.sessionId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-semibold">{session?.user.name}</h2>
            <p className="text-sm text-gray-500">{session?.user.email}</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-green-500 text-white rounded-lg">
              Mark Resolved
            </button>
            <button className="px-4 py-2 bg-gray-200 rounded-lg">
              Transfer
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-4 ${msg.type === 'agent' ? 'text-right' : ''}`}
          >
            <div
              className={`inline-block max-w-md p-3 rounded-lg ${
                msg.type === 'agent'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white shadow'
              }`}
            >
              {msg.content}
              {msg.attachments?.map((att) => (
                <a key={att.id} href={att.url} className="block mt-2 text-sm underline">
                  📎 {att.name}
                </a>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="flex gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendReply()}
            placeholder="Type your reply..."
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button
            onClick={sendReply}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## API Endpoints

### Required Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/sessions` | Create new chat session |
| GET | `/api/chat/sessions/:id` | Get session details |
| POST | `/api/chat/sessions/:id/messages` | Send message |
| GET | `/api/chat/sessions/:id/messages` | Get message history |
| POST | `/api/chat/upload` | Upload attachments |
| PATCH | `/api/chat/sessions/:id/status` | Update session status |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/chat/sessions` | List all sessions |
| POST | `/api/admin/chat/sessions/:id/reply` | Send agent reply |
| PATCH | `/api/admin/chat/sessions/:id/assign` | Assign to agent |
| GET | `/api/admin/chat/analytics` | Get chat analytics |

### Example API Implementation (Next.js)

```typescript
// /app/api/chat/sessions/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { user, sessionId } = await request.json();

  // Save to database
  const session = await db.chatSession.create({
    data: {
      id: sessionId,
      userName: user.name,
      userEmail: user.email,
      status: 'active',
      startedAt: new Date(),
    },
  });

  // Notify admin dashboard via WebSocket
  broadcastToAdmins({
    type: 'new_session',
    session,
  });

  return NextResponse.json({ success: true, session });
}

// /app/api/chat/sessions/[id]/messages/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { message } = await request.json();

  // Save message to database
  await db.chatMessage.create({
    data: {
      sessionId: params.id,
      type: message.type,
      content: message.content,
      timestamp: new Date(),
      attachments: message.attachments,
    },
  });

  // Notify admin via WebSocket
  broadcastToSession(params.id, {
    type: 'user_message',
    message,
  });

  return NextResponse.json({ success: true });
}
```

---

## Database Schema

### Prisma Schema Example

```prisma
model ChatSession {
  id          String        @id
  userName    String
  userEmail   String
  userPhone   String?
  status      SessionStatus @default(ACTIVE)
  assignedTo  String?
  startedAt   DateTime      @default(now())
  endedAt     DateTime?
  messages    ChatMessage[]
  
  @@index([status])
  @@index([userEmail])
}

model ChatMessage {
  id          String       @id @default(cuid())
  sessionId   String
  session     ChatSession  @relation(fields: [sessionId], references: [id])
  type        MessageType
  content     String
  timestamp   DateTime     @default(now())
  agentName   String?
  attachments Json?
  
  @@index([sessionId])
}

enum SessionStatus {
  ACTIVE
  PENDING
  CLOSED
}

enum MessageType {
  USER
  AGENT
  SYSTEM
}
```

---

## Customization

### Change Agent Name/Avatar

In `LiveChatContext.tsx`:

```typescript
const welcomeMessage: ChatMessage = {
  // ...
  agentName: "Your Agent Name",
  agentAvatar: "A", // Single letter or emoji
};
```

### Add More Emojis

In `LiveChatWidget.tsx`, update the `commonEmojis` array:

```typescript
const commonEmojis = [
  "😊", "👍", "❤️", // ... add more
];
```

### Change File Size Limit

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // Change to desired size
```

### Add More File Types

```typescript
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  // Add more MIME types
];
```

### Customize Quick Actions

```typescript
const quickActions = [
  { label: "Custom Label", message: "Custom message to send" },
  // Add more
];
```

---

## Deployment Checklist

- [ ] Set up WebSocket server for real-time communication
- [ ] Configure file storage (S3, Cloudinary, etc.)
- [ ] Create database tables/collections
- [ ] Implement API endpoints
- [ ] Build admin dashboard
- [ ] Set up email notifications for new chats
- [ ] Configure agent assignment logic
- [ ] Add analytics tracking
- [ ] Test with multiple concurrent sessions
- [ ] Add rate limiting for spam protection

---

## Support

For questions or issues with the live chat implementation, contact the development team.

Last updated: December 2024


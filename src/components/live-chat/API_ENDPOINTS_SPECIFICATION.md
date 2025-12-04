# Live Chat API Endpoints Specification

## Overview

This document provides detailed specifications for implementing the server-side API endpoints for the LocalPro Live Chat system.

---

## Base URL

```
Production: https://api.localpro.asia
Development: http://localhost:3001
```

---

## Implemented Endpoints

### Public Endpoints (No auth required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/live-chat/sessions` | Create new chat session |
| `GET` | `/api/live-chat/sessions/:sessionId` | Get session details |
| `POST` | `/api/live-chat/sessions/:sessionId/messages` | Send message (with file uploads) |
| `GET` | `/api/live-chat/sessions/:sessionId/messages` | Get messages |
| `POST` | `/api/live-chat/upload` | Upload attachments |
| `PATCH` | `/api/live-chat/sessions/:sessionId/end` | End session |
| `POST` | `/api/live-chat/sessions/:sessionId/rate` | Rate session |
| `POST` | `/api/live-chat/sessions/:sessionId/typing` | Typing indicator |

### Admin Endpoints (Requires admin auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/live-chat/sessions` | List all sessions with filters |
| `GET` | `/api/admin/live-chat/sessions/:sessionId` | Get session with messages |
| `POST` | `/api/admin/live-chat/sessions/:sessionId/reply` | Send agent reply |
| `PATCH` | `/api/admin/live-chat/sessions/:sessionId/assign` | Assign to agent |
| `PATCH` | `/api/admin/live-chat/sessions/:sessionId/status` | Update status |
| `POST` | `/api/admin/live-chat/sessions/:sessionId/notes` | Add internal notes |
| `POST` | `/api/admin/live-chat/sessions/:sessionId/transfer` | Transfer session |
| `GET` | `/api/admin/live-chat/analytics` | Get chat analytics |
| `GET` | `/api/admin/live-chat/customers/:email/history` | Customer history |
| `DELETE` | `/api/admin/live-chat/sessions/:sessionId` | Delete session |

---

## 1. Chat Session Endpoints

### 1.1 Create Chat Session

Creates a new chat session when user starts chatting.

```http
POST /chat/sessions
```

**Request Body:**
```json
{
  "sessionId": "session-1701691234567-abc123xyz",
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+639171234567"  // optional
  },
  "metadata": {
    "page": "/contact",
    "userAgent": "Mozilla/5.0...",
    "referrer": "https://google.com",
    "language": "en-PH"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "sessionId": "session-1701691234567-abc123xyz",
    "sessionToken": "eyJhbGciOiJIUzI1NiIs...",  // For subsequent requests
    "status": "active",
    "createdAt": "2024-12-04T12:00:00.000Z",
    "welcomeMessage": {
      "id": "msg-welcome",
      "type": "agent",
      "content": "Hi! 👋 Welcome to LocalPro support...",
      "agentName": "Ria",
      "agentAvatar": "R",
      "timestamp": "2024-12-04T12:00:00.000Z"
    }
  }
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "success": false,
  "error": {
    "code": "INVALID_EMAIL",
    "message": "Please provide a valid email address"
  }
}

// 429 Too Many Requests
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many sessions created. Please try again later."
  }
}
```

---

### 1.2 Get Session Details

```http
GET /chat/sessions/:sessionId
Authorization: Bearer <sessionToken>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessionId": "session-1701691234567-abc123xyz",
    "user": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "status": "active",
    "assignedAgent": {
      "id": "agent-123",
      "name": "Ria",
      "avatar": "R"
    },
    "createdAt": "2024-12-04T12:00:00.000Z",
    "lastMessageAt": "2024-12-04T12:05:00.000Z",
    "messageCount": 5
  }
}
```

---

### 1.3 End Chat Session

```http
PATCH /chat/sessions/:sessionId/end
Authorization: Bearer <sessionToken>
```

**Request Body:**
```json
{
  "reason": "resolved",  // "resolved" | "user_left" | "timeout" | "transferred"
  "feedback": {
    "rating": 5,         // 1-5, optional
    "comment": "Great support!"  // optional
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessionId": "session-1701691234567-abc123xyz",
    "status": "closed",
    "endedAt": "2024-12-04T12:30:00.000Z",
    "duration": 1800,  // seconds
    "messageCount": 15
  }
}
```

---

## 2. Message Endpoints

### 2.1 Send Message

```http
POST /chat/sessions/:sessionId/messages
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Hello, I need help with my account",
  "attachments": [
    {
      "id": "att-123",
      "name": "screenshot.png",
      "type": "image/png",
      "size": 245678,
      "url": "https://storage.localpro.asia/chat/att-123.png"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "msg-1701691234567",
      "type": "user",
      "content": "Hello, I need help with my account",
      "attachments": [...],
      "timestamp": "2024-12-04T12:05:00.000Z",
      "status": "delivered"
    }
  }
}
```

---

### 2.2 Get Messages

```http
GET /chat/sessions/:sessionId/messages?limit=50&before=msg-123
Authorization: Bearer <sessionToken>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 50 | Max messages to return |
| `before` | string | - | Message ID for pagination (older messages) |
| `after` | string | - | Message ID for pagination (newer messages) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg-001",
        "type": "agent",
        "content": "Hi! 👋 Welcome to LocalPro support...",
        "agentName": "Ria",
        "agentAvatar": "R",
        "timestamp": "2024-12-04T12:00:00.000Z"
      },
      {
        "id": "msg-002",
        "type": "system",
        "content": "John Doe joined the chat",
        "timestamp": "2024-12-04T12:00:01.000Z"
      },
      {
        "id": "msg-003",
        "type": "user",
        "content": "Hello, I need help",
        "timestamp": "2024-12-04T12:01:00.000Z"
      }
    ],
    "pagination": {
      "hasMore": true,
      "nextCursor": "msg-000"
    }
  }
}
```

---

## 3. File Upload Endpoint

### 3.1 Upload Attachment

```http
POST /chat/upload
Authorization: Bearer <sessionToken>
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
files: [File, File, ...]  // Max 5 files
sessionId: "session-123"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "attachments": [
      {
        "id": "att-abc123",
        "name": "document.pdf",
        "type": "application/pdf",
        "size": 1234567,
        "url": "https://storage.localpro.asia/chat/att-abc123.pdf",
        "previewUrl": null
      },
      {
        "id": "att-def456",
        "name": "photo.jpg",
        "type": "image/jpeg",
        "size": 234567,
        "url": "https://storage.localpro.asia/chat/att-def456.jpg",
        "previewUrl": "https://storage.localpro.asia/chat/att-def456-thumb.jpg"
      }
    ]
  }
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File exceeds maximum size of 10MB",
    "details": { "fileName": "large-video.mp4", "size": 52428800 }
  }
}

// 415 Unsupported Media Type
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "File type not allowed",
    "details": { "fileName": "script.exe", "type": "application/x-msdownload" }
  }
}
```

---

## 4. Admin Endpoints

### 4.1 List All Sessions

```http
GET /admin/chat/sessions?status=active&page=1&limit=20
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | all | Filter: `all`, `active`, `pending`, `closed` |
| `assignedTo` | string | - | Filter by agent ID |
| `search` | string | - | Search in user name/email |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `sortBy` | string | lastMessageAt | Sort field |
| `sortOrder` | string | desc | `asc` or `desc` |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session-123",
        "user": {
          "name": "John Doe",
          "email": "john@example.com"
        },
        "status": "active",
        "assignedAgent": {
          "id": "agent-456",
          "name": "Ria"
        },
        "lastMessage": {
          "content": "I need help with...",
          "timestamp": "2024-12-04T12:05:00.000Z"
        },
        "unreadCount": 2,
        "createdAt": "2024-12-04T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    },
    "stats": {
      "active": 12,
      "pending": 5,
      "closed": 28
    }
  }
}
```

---

### 4.2 Send Agent Reply

```http
POST /admin/chat/sessions/:sessionId/reply
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "content": "Hi John! I'd be happy to help you with that.",
  "attachments": []  // optional
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "msg-agent-123",
      "type": "agent",
      "content": "Hi John! I'd be happy to help you with that.",
      "agentName": "Ria",
      "agentAvatar": "R",
      "agentId": "agent-456",
      "timestamp": "2024-12-04T12:06:00.000Z"
    }
  }
}
```

---

### 4.3 Assign Session to Agent

```http
PATCH /admin/chat/sessions/:sessionId/assign
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "agentId": "agent-789",
  "note": "Transferred due to technical expertise needed"  // optional
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessionId": "session-123",
    "previousAgent": {
      "id": "agent-456",
      "name": "Ria"
    },
    "newAgent": {
      "id": "agent-789",
      "name": "Mark"
    },
    "assignedAt": "2024-12-04T12:10:00.000Z"
  }
}
```

---

### 4.4 Update Session Status

```http
PATCH /admin/chat/sessions/:sessionId/status
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "status": "closed",
  "reason": "resolved",
  "internalNote": "Customer issue resolved - password reset"  // optional
}
```

---

### 4.5 Get Chat Analytics

```http
GET /admin/chat/analytics?startDate=2024-12-01&endDate=2024-12-04
Authorization: Bearer <adminToken>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-12-01T00:00:00.000Z",
      "end": "2024-12-04T23:59:59.000Z"
    },
    "overview": {
      "totalSessions": 156,
      "activeSessions": 12,
      "averageResponseTime": 45,  // seconds
      "averageSessionDuration": 480,  // seconds
      "satisfactionScore": 4.5
    },
    "byDay": [
      {
        "date": "2024-12-01",
        "sessions": 42,
        "messages": 320,
        "avgResponseTime": 38
      }
    ],
    "byAgent": [
      {
        "agentId": "agent-456",
        "agentName": "Ria",
        "sessionsHandled": 45,
        "avgResponseTime": 32,
        "satisfactionScore": 4.8
      }
    ],
    "topIssues": [
      { "category": "Account", "count": 45 },
      { "category": "Technical", "count": 38 },
      { "category": "Billing", "count": 25 }
    ]
  }
}
```

---

## 5. WebSocket Events

### Connection

```javascript
// Client connects
const ws = new WebSocket('wss://api.localpro.asia/ws/chat');

// Authenticate
ws.send(JSON.stringify({
  type: 'auth',
  token: 'sessionToken or adminToken',
  sessionId: 'session-123'  // for user
}));
```

### Events: User → Server

```json
// User sends message
{
  "type": "message",
  "sessionId": "session-123",
  "content": "Hello!",
  "attachments": []
}

// User is typing
{
  "type": "typing",
  "sessionId": "session-123",
  "isTyping": true
}

// User read messages
{
  "type": "read",
  "sessionId": "session-123",
  "lastReadMessageId": "msg-123"
}
```

### Events: Server → User

```json
// Agent message
{
  "type": "agent_message",
  "message": {
    "id": "msg-456",
    "type": "agent",
    "content": "How can I help?",
    "agentName": "Ria",
    "timestamp": "2024-12-04T12:05:00.000Z"
  }
}

// Agent typing
{
  "type": "agent_typing",
  "isTyping": true,
  "agentName": "Ria"
}

// Session transferred
{
  "type": "session_transferred",
  "newAgent": {
    "name": "Mark",
    "avatar": "M"
  }
}

// Session ended
{
  "type": "session_ended",
  "reason": "resolved"
}
```

### Events: Server → Admin

```json
// New session created
{
  "type": "new_session",
  "session": {
    "id": "session-123",
    "user": { "name": "John", "email": "john@example.com" },
    "createdAt": "2024-12-04T12:00:00.000Z"
  }
}

// New user message
{
  "type": "user_message",
  "sessionId": "session-123",
  "message": { ... }
}

// User typing
{
  "type": "user_typing",
  "sessionId": "session-123",
  "isTyping": true
}
```

---

## 6. Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /chat/sessions` | 5 | 1 hour per IP |
| `POST /chat/sessions/:id/messages` | 30 | 1 minute per session |
| `POST /chat/upload` | 10 | 1 minute per session |
| Admin endpoints | 1000 | 1 minute per admin |

---

## 7. Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Malformed request body |
| `INVALID_EMAIL` | 400 | Invalid email format |
| `FILE_TOO_LARGE` | 400 | File exceeds 10MB |
| `INVALID_FILE_TYPE` | 415 | File type not allowed |
| `UNAUTHORIZED` | 401 | Invalid or missing token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `SESSION_NOT_FOUND` | 404 | Chat session doesn't exist |
| `SESSION_CLOSED` | 409 | Cannot message closed session |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 8. Implementation Example (Node.js/Express)

```typescript
// routes/chat.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import jwt from 'jsonwebtoken';

const router = express.Router();
const prisma = new PrismaClient();

// Create chat session
router.post('/sessions', async (req, res) => {
  try {
    const { sessionId, user, metadata } = req.body;

    // Validate email
    if (!isValidEmail(user.email)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_EMAIL', message: 'Invalid email format' }
      });
    }

    // Create session in database
    const session = await prisma.chatSession.create({
      data: {
        id: sessionId,
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone,
        status: 'ACTIVE',
        metadata: metadata,
      }
    });

    // Generate session token
    const sessionToken = jwt.sign(
      { sessionId, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Create welcome message
    const welcomeMessage = await prisma.chatMessage.create({
      data: {
        id: `msg-${uuid()}`,
        sessionId,
        type: 'AGENT',
        content: "Hi! 👋 Welcome to LocalPro support. How can I help you today?",
        agentName: 'Ria',
      }
    });

    // Notify admins via WebSocket
    broadcastToAdmins({
      type: 'new_session',
      session: { id: sessionId, user, createdAt: session.createdAt }
    });

    res.status(201).json({
      success: true,
      data: {
        sessionId,
        sessionToken,
        status: 'active',
        createdAt: session.createdAt,
        welcomeMessage
      }
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create session' }
    });
  }
});

// Send message
router.post('/sessions/:sessionId/messages', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content, attachments } = req.body;

    // Check session exists and is active
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' }
      });
    }

    if (session.status === 'CLOSED') {
      return res.status(409).json({
        success: false,
        error: { code: 'SESSION_CLOSED', message: 'Cannot send to closed session' }
      });
    }

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        id: `msg-${Date.now()}`,
        sessionId,
        type: 'USER',
        content,
        attachments: attachments || [],
      }
    });

    // Update session last message time
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { lastMessageAt: new Date() }
    });

    // Notify assigned agent via WebSocket
    if (session.assignedTo) {
      sendToAgent(session.assignedTo, {
        type: 'user_message',
        sessionId,
        message
      });
    }

    // Broadcast to admin dashboard
    broadcastToAdmins({
      type: 'user_message',
      sessionId,
      message
    });

    res.status(201).json({
      success: true,
      data: { message }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to send message' }
    });
  }
});

export default router;
```

---

## 9. Next.js API Routes Alternative

```typescript
// app/api/chat/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signJwt } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, user, metadata } = body;

    // Create session
    const session = await prisma.chatSession.create({
      data: {
        id: sessionId,
        userName: user.name,
        userEmail: user.email,
        status: 'ACTIVE',
      }
    });

    // Generate token
    const sessionToken = await signJwt({ sessionId });

    return NextResponse.json({
      success: true,
      data: { sessionId, sessionToken, status: 'active' }
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create session' }
    }, { status: 500 });
  }
}

// app/api/chat/sessions/[sessionId]/messages/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  // Implementation similar to Express version
}
```

---

## 10. Deployment Checklist

- [ ] Set up PostgreSQL/MongoDB for chat data
- [ ] Configure Redis for WebSocket pub/sub
- [ ] Set up file storage (S3, Cloudinary, or similar)
- [ ] Implement JWT authentication
- [ ] Add rate limiting middleware
- [ ] Set up WebSocket server (Socket.io or ws)
- [ ] Configure CORS for your domains
- [ ] Add request logging and monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Create database indexes for performance
- [ ] Test all endpoints with Postman/Insomnia
- [ ] Write integration tests

---

## Support

For questions about implementation, contact the development team.

Last updated: December 2024


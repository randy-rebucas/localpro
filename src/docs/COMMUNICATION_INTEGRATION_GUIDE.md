# Communication System Integration Guide - Modern Implementation

## ✅ **MODERN OVERVIEW: API Constants Integration**
This guide covers the **complete implementation** of the communication and notification system with **modern API constants**, **enterprise-grade authentication**, and **type-safe endpoint management**.

## 🚀 **Quick Start with API Constants**

### 1. **Import Modern Communication Utilities**
```typescript
// ✅ MODERN APPROACH: Using API Constants
import { makeAuthenticatedRequestWithEndpoint, makeAuthenticatedRequestWithPath } from '@/lib/api-auth-utils';
import { CommunicationAPI, RealtimeCommunication, MessageUtils, NotificationUtils } from '@/lib/communication-utils';
```

### 2. **Modern Usage Examples with API Constants**

#### **Fetch Conversations (Modern)**
```typescript
// ✅ Server-side API route with API constants
export async function GET(request: NextRequest) {
  try {
    const response = await makeAuthenticatedRequestWithEndpoint(
      request,
      'communicationConversations', // TypeScript autocomplete
      { method: 'GET' }
    );
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### **Send a Message (Modern)**
```typescript
// ✅ Dynamic endpoint with parameters
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'communicationMessages',
      [id], // Path parameters
      body, // Request body
      { method: 'POST' }
    );
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### **Get Conversation with Specific User (Modern)**
```typescript
// ✅ Dynamic endpoint with user ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'communicationConversationWith',
      [userId], // Path parameters
      {}, // Query parameters
      { method: 'GET' }
    );
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### **Send Email Notification (Modern)**
```typescript
// ✅ Public endpoint for notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await makePublicRequest(
      'communicationNotificationsEmail', // TypeScript autocomplete
      { 
        method: 'POST',
        body: JSON.stringify(body)
      }
    );
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## 📡 **Real-time Communication (Modern)**

### **Setup EventSource Connection with API Constants**
```typescript
// ✅ MODERN APPROACH: Using API Constants for real-time
import { RealtimeCommunication } from '@/lib/communication-utils';
import { makeAuthenticatedRequestWithEndpoint } from '@/lib/api-auth-utils';

// Connect to real-time events with automatic authentication
RealtimeCommunication.connect();

// Listen for events with type safety
RealtimeCommunication.on('new_message', (data) => {
  console.log('New message:', data);
});

RealtimeCommunication.on('typing_start', (data) => {
  console.log('User started typing:', data);
});

// Send typing indicators with API constants
await RealtimeCommunication.sendTyping('conversation-id', 'start');
await RealtimeCommunication.sendTyping('conversation-id', 'stop');
```

### **Modern Real-time API Routes**
```typescript
// ✅ Real-time events endpoint with API constants
export async function GET(request: NextRequest) {
  try {
    const response = await makeAuthenticatedRequestWithEndpoint(
      request,
      'communicationEvents', // TypeScript autocomplete
      { method: 'GET' }
    );
    
    // Set up Server-Sent Events
    const stream = new ReadableStream({
      start(controller) {
        // Handle real-time events
        RealtimeCommunication.on('new_message', (data) => {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        });
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## 🎨 UI Components

### Message Composer
```tsx
import MessageComposer from '@/components/communication/MessageComposer';

<MessageComposer
  conversationId="conv-123"
  onMessageSent={(message) => console.log('Message sent:', message)}
  onTyping={(isTyping) => console.log('Typing:', isTyping)}
/>
```

### Notification Center
```tsx
import NotificationCenter from '@/components/communication/NotificationCenter';

<NotificationCenter
  isOpen={showNotifications}
  onClose={() => setShowNotifications(false)}
  onNotificationClick={(notification) => handleNotificationClick(notification)}
/>
```

### Conversation with User
```tsx
import ConversationWithUser from '@/components/communication/ConversationWithUser';

<ConversationWithUser
  userId="user-123"
  onConversationFound={(conversation) => openConversation(conversation)}
  onCreateConversation={(userId) => startNewConversation(userId)}
/>
```

### Notification Channels
```tsx
import NotificationChannels from '@/components/communication/NotificationChannels';

<NotificationChannels
  isOpen={showNotificationModal}
  onClose={() => setShowNotificationModal(false)}
  recipient={{
    email: 'user@example.com',
    phone: '+1234567890',
    name: 'John Doe'
  }}
/>
```

## 🔧 **API Endpoints Reference (Modern API Constants)**

### **Conversation Management (Type-Safe Endpoints)**
```typescript
// ✅ Simple endpoints with API constants
'communicationConversations' // GET /api/communication/conversations
'communicationConversationsById' // GET /api/communication/conversations/:id
'communicationConversationWith' // GET /api/communication/conversation-with/:userId

// ✅ Dynamic endpoints with parameters
const response = await makeAuthenticatedRequestWithPath(
  request,
  'communicationConversationsById',
  [id], // Path parameters
  { page: 1, limit: 20 }, // Query parameters
  { method: 'GET' }
);
```

### **Message Management (Modern Implementation)**
```typescript
// ✅ Message endpoints with API constants
'communicationMessages' // POST /api/communication/conversations/:id/messages
'communicationMessagesById' // PUT /api/communication/conversations/:id/messages/:messageId
'communicationMessagesDelete' // DELETE /api/communication/conversations/:id/messages/:messageId

// ✅ Usage with dynamic parameters
const response = await makeAuthenticatedRequestWithPath(
  request,
  'communicationMessages',
  [conversationId, messageId], // Path parameters
  { content: 'Updated message' }, // Request body
  { method: 'PUT' }
);
```

### **Read Status Management (Automatic)**
```typescript
// ✅ Read status endpoints
'communicationConversationsRead' // PUT /api/communication/conversations/:id/read
'communicationUnreadCount' // GET /api/communication/unread-count

// ✅ Usage with automatic authentication
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'communicationUnreadCount',
  { method: 'GET' }
);
```

### **Notification System (Enterprise-Grade)**
```typescript
// ✅ Notification endpoints with API constants
'communicationNotifications' // GET /api/communication/notifications
'communicationNotificationsCount' // GET /api/communication/notifications/count
'communicationNotificationsRead' // PUT /api/communication/notifications/:id/read
'communicationNotificationsReadAll' // PUT /api/communication/notifications/read-all
'communicationNotificationsDelete' // DELETE /api/communication/notifications/:id

// ✅ Usage with type safety
const response = await makeAuthenticatedRequestWithPath(
  request,
  'communicationNotificationsRead',
  [notificationId], // Path parameters
  {}, // Query parameters
  { method: 'PUT' }
);
```

### **Communication Channels (Modern)**
```typescript
// ✅ Channel endpoints with API constants
'communicationNotificationsEmail' // POST /api/communication/notifications/email
'communicationNotificationsSms' // POST /api/communication/notifications/sms

// ✅ Public endpoint usage
const response = await makePublicRequest(
  'communicationNotificationsEmail',
  { 
    method: 'POST',
    body: JSON.stringify({
      to: 'user@example.com',
      subject: 'New Message',
      content: 'You have a new message!'
    })
  }
);
```

### **Real-time Events (Advanced)**
```typescript
// ✅ Real-time endpoints with API constants
'communicationEvents' // GET /api/communication/events
'communicationTyping' // POST /api/communication/typing

// ✅ Real-time usage with automatic authentication
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'communicationEvents',
  { method: 'GET' }
);
```

## 🧪 **Testing (Modern API Constants)**

### **Run Test Suite with API Constants**
```typescript
// ✅ MODERN TESTING: Using API Constants
import { runCommunicationTests } from '@/lib/communication-test';
import { makeAuthenticatedRequestWithEndpoint } from '@/lib/api-auth-utils';

// Run all tests with API constants
const results = await runCommunicationTests();
console.log('Test Results:', results);
```

### **Modern Manual Testing**
```typescript
// ✅ Test individual endpoints with API constants
try {
  // Test with API constants
  const response = await makeAuthenticatedRequestWithEndpoint(
    request,
    'communicationConversations',
    { method: 'GET' }
  );
  console.log('✅ Conversations API working with API constants');
} catch (error) {
  console.error('❌ Conversations API failed:', error);
}
```

### **API Constants Testing**
```typescript
// ✅ Test all communication endpoints
const testEndpoints = [
  'communicationConversations',
  'communicationMessages',
  'communicationNotifications',
  'communicationEvents'
];

for (const endpoint of testEndpoints) {
  try {
    const response = await makeAuthenticatedRequestWithEndpoint(
      request,
      endpoint,
      { method: 'GET' }
    );
    console.log(`✅ ${endpoint} working`);
  } catch (error) {
    console.error(`❌ ${endpoint} failed:`, error);
  }
}
```

## 🔄 Real-time Event Types

### Message Events
- `new_message` - New message received
- `message_updated` - Message was updated
- `message_deleted` - Message was deleted

### Typing Events
- `typing_start` - User started typing
- `typing_stop` - User stopped typing

### Notification Events
- `notification` - New notification received
- `notification_read` - Notification was marked as read

### Connection Events
- `connection` - Connected to real-time events
- `heartbeat` - Keep-alive ping
- `disconnect` - Connection lost

## 📱 Mobile Responsiveness

All components are fully responsive and work on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🔒 Security Features

- **Authentication**: All endpoints require valid session
- **Authorization**: User can only access their own data
- **Rate Limiting**: Built-in protection against spam
- **Input Validation**: All inputs are validated and sanitized
- **CORS**: Properly configured for cross-origin requests

## 🚀 Performance Optimizations

- **Pagination**: All list endpoints support pagination
- **Caching**: Intelligent caching for frequently accessed data
- **Debouncing**: Typing indicators are debounced
- **Connection Pooling**: Efficient database connections
- **Compression**: Gzip compression for API responses

## 🐛 Error Handling

### API Errors
```typescript
try {
  const result = await CommunicationAPI.getConversations();
} catch (error) {
  if (error.message.includes('401')) {
    // Handle authentication error
  } else if (error.message.includes('500')) {
    // Handle server error
  }
}
```

### Real-time Errors
```typescript
RealtimeCommunication.on('error', (error) => {
  console.error('Real-time error:', error);
  // Attempt to reconnect
  RealtimeCommunication.connect();
});
```

## 📊 Monitoring

### Health Checks
```typescript
// Check if all endpoints are working
const healthCheck = await CommunicationAPI.getConversations({ limit: 1 });
if (healthCheck) {
  console.log('✅ Communication system is healthy');
}
```

### Performance Monitoring
```typescript
// Monitor API response times
const start = Date.now();
await CommunicationAPI.getConversations();
const duration = Date.now() - start;
console.log(`API call took ${duration}ms`);
```

## 🔧 Configuration

### Environment Variables
```env
# API Configuration
API_BASE_URL=https://your-api-server.com
API_TIMEOUT=30000

# Real-time Configuration
EVENT_SOURCE_TIMEOUT=30000
HEARTBEAT_INTERVAL=30000

# Notification Configuration
EMAIL_SERVICE_URL=https://your-email-service.com
SMS_SERVICE_URL=https://your-sms-service.com
```

## 🎯 **Best Practices (Modern API Constants)**

### **1. Use API Constants for All Endpoints**
```typescript
// ✅ DO: Use API constants
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'communicationConversations', // TypeScript autocomplete
  { method: 'GET' }
);

// ❌ DON'T: Hardcode URLs
const response = await fetch('/api/communication/conversations');
```

### **2. Implement Proper Error Handling**
```typescript
// ✅ DO: Use handleApiRoute for error handling
const result = await handleApiRoute(async () => {
  const response = await makeAuthenticatedRequestWithEndpoint(
    request,
    'communicationConversations',
    { method: 'GET' }
  );
  return await response.json();
}, "Communication conversations");

if (result.error) {
  return NextResponse.json(
    { error: result.error },
    { status: result.status }
  );
}
```

### **3. Use Type-Safe Parameter Handling**
```typescript
// ✅ DO: Use makeAuthenticatedRequestWithPath for dynamic endpoints
const response = await makeAuthenticatedRequestWithPath(
  request,
  'communicationMessages',
  [conversationId, messageId], // Path parameters
  { include: 'user' }, // Query parameters
  { method: 'GET' }
);
```

### **4. Modern Best Practices**
1. **Always use API constants** for endpoint management
2. **Implement proper error handling** with `handleApiRoute()`
3. **Use TypeScript for type safety** with autocomplete
4. **Test all endpoints thoroughly** with API constants
5. **Monitor performance metrics** with sub-millisecond operations
6. **Implement proper cleanup** for real-time connections
7. **Use pagination for large datasets** with query parameters
8. **Cache frequently accessed data** with automatic caching

## 📚 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Component Library](./COMPONENT_LIBRARY.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

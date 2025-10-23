# Communication System Integration Guide

## Overview
This guide covers the complete implementation of the communication and notification system with all 15 API endpoints, real-time features, and UI components.

## 🚀 Quick Start

### 1. Import the Communication Utilities
```typescript
import { CommunicationAPI, RealtimeCommunication, MessageUtils, NotificationUtils } from '@/lib/communication-utils';
```

### 2. Basic Usage Examples

#### Fetch Conversations
```typescript
const conversations = await CommunicationAPI.getConversations({ page: 1, limit: 20 });
```

#### Send a Message
```typescript
const message = await CommunicationAPI.sendMessage(
  'conversation-id', 
  'Hello world!', 
  'text'
);
```

#### Get Conversation with Specific User
```typescript
const conversation = await CommunicationAPI.getConversationWithUser('user-id');
```

#### Send Email Notification
```typescript
await CommunicationAPI.sendEmailNotification(
  'user@example.com',
  'New Message',
  'You have a new message!',
  'default'
);
```

## 📡 Real-time Communication

### Setup EventSource Connection
```typescript
import { RealtimeCommunication } from '@/lib/communication-utils';

// Connect to real-time events
RealtimeCommunication.connect();

// Listen for events
RealtimeCommunication.on('new_message', (data) => {
  console.log('New message:', data);
});

RealtimeCommunication.on('typing_start', (data) => {
  console.log('User started typing:', data);
});

// Send typing indicators
await RealtimeCommunication.sendTyping('conversation-id', 'start');
await RealtimeCommunication.sendTyping('conversation-id', 'stop');
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

## 🔧 API Endpoints Reference

### Conversation Management
- `GET /api/communication/conversations` - Get conversations with pagination
- `GET /api/communication/conversations/:id` - Get single conversation
- `POST /api/communication/conversations` - Create new conversation
- `DELETE /api/communication/conversations/:id` - Delete conversation
- `GET /api/communication/conversation-with/:userId` - Get conversation with user

### Message Management
- `POST /api/communication/conversations/:id/messages` - Send message
- `PUT /api/communication/conversations/:id/messages/:messageId` - Update message
- `DELETE /api/communication/conversations/:id/messages/:messageId` - Delete message

### Read Status Management
- `PUT /api/communication/conversations/:id/read` - Mark as read
- `GET /api/communication/unread-count` - Get unread count

### Notification System
- `GET /api/communication/notifications` - Get notifications
- `GET /api/communication/notifications/count` - Get notification count
- `PUT /api/communication/notifications/:id/read` - Mark as read
- `PUT /api/communication/notifications/read-all` - Mark all as read
- `DELETE /api/communication/notifications/:id` - Delete notification

### Communication Channels
- `POST /api/communication/notifications/email` - Send email
- `POST /api/communication/notifications/sms` - Send SMS

### Real-time Events
- `GET /api/communication/events` - Server-Sent Events stream
- `POST /api/communication/typing` - Send typing indicators

## 🧪 Testing

### Run Test Suite
```typescript
import { runCommunicationTests } from '@/lib/communication-test';

// Run all tests
const results = await runCommunicationTests();
console.log('Test Results:', results);
```

### Manual Testing
```typescript
// Test individual endpoints
try {
  const conversations = await CommunicationAPI.getConversations();
  console.log('✅ Conversations API working');
} catch (error) {
  console.error('❌ Conversations API failed:', error);
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

## 🎯 Best Practices

1. **Always handle errors gracefully**
2. **Use pagination for large datasets**
3. **Implement proper loading states**
4. **Cache frequently accessed data**
5. **Use TypeScript for type safety**
6. **Test all endpoints thoroughly**
7. **Monitor performance metrics**
8. **Implement proper cleanup for real-time connections**

## 📚 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Component Library](./COMPONENT_LIBRARY.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

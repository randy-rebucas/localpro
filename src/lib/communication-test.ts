import { CommunicationAPI, RealtimeCommunication } from './communication-utils';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'pass' | 'fail' | 'pending';
  error?: string;
  duration?: number;
}

// Test suite for communication endpoints
export class CommunicationTestSuite {
  private static testResults: TestResult[] = [];

  static async runAllTests(): Promise<{
    total: number;
    passed: number;
    failed: number;
    results: TestResult[];
  }> {
    console.log('🧪 Starting Communication API Test Suite...');
    this.testResults = [];

    // Test all endpoints
    await this.testConversationManagement();
    await this.testMessageManagement();
    await this.testReadStatusManagement();
    await this.testNotificationSystem();
    await this.testCommunicationChannels();

    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'pass').length;
    const failed = this.testResults.filter(r => r.status === 'fail').length;

    console.log(`\n📊 Test Results: ${passed}/${total} passed, ${failed} failed`);

    return { total, passed, failed, results: this.testResults };
  }

  private static async testEndpoint(
    name: string,
    method: string,
    testFn: () => Promise<unknown>
  ): Promise<void> {
    const startTime = Date.now();
    try {
      await testFn();
      this.testResults.push({
        endpoint: name,
        method,
        status: 'pass',
        duration: Date.now() - startTime
      });
      console.log(`✅ ${method} ${name} - PASSED`);
    } catch (error) {
      this.testResults.push({
        endpoint: name,
        method,
        status: 'fail',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      console.log(`❌ ${method} ${name} - FAILED: ${error}`);
    }
  }

  private static async testConversationManagement(): Promise<void> {
    console.log('\n📞 Testing Conversation Management...');

    await this.testEndpoint(
      'GET /conversations',
      'GET',
      () => CommunicationAPI.getConversations({ page: 1, limit: 10 })
    );

    await this.testEndpoint(
      'GET /conversations/:id',
      'GET',
      () => CommunicationAPI.getConversation('test-conversation-id')
    );

    await this.testEndpoint(
      'GET /conversation-with/:userId',
      'GET',
      () => CommunicationAPI.getConversationWithUser('test-user-id')
    );

    await this.testEndpoint(
      'POST /conversations',
      'POST',
      () => CommunicationAPI.createConversation(['user1', 'user2'], 'Test Conversation')
    );

    await this.testEndpoint(
      'DELETE /conversations/:id',
      'DELETE',
      () => CommunicationAPI.deleteConversation('test-conversation-id')
    );
  }

  private static async testMessageManagement(): Promise<void> {
    console.log('\n📨 Testing Message Management...');

    await this.testEndpoint(
      'POST /conversations/:id/messages',
      'POST',
      () => CommunicationAPI.sendMessage('test-conversation-id', 'Test message', 'text')
    );

    await this.testEndpoint(
      'PUT /conversations/:id/messages/:messageId',
      'PUT',
      () => CommunicationAPI.updateMessage('test-conversation-id', 'test-message-id', 'Updated message')
    );

    await this.testEndpoint(
      'DELETE /conversations/:id/messages/:messageId',
      'DELETE',
      () => CommunicationAPI.deleteMessage('test-conversation-id', 'test-message-id')
    );
  }

  private static async testReadStatusManagement(): Promise<void> {
    console.log('\n👁️ Testing Read Status Management...');

    await this.testEndpoint(
      'PUT /conversations/:id/read',
      'PUT',
      () => CommunicationAPI.markConversationAsRead('test-conversation-id')
    );

    await this.testEndpoint(
      'GET /unread-count',
      'GET',
      () => CommunicationAPI.getUnreadCount()
    );
  }

  private static async testNotificationSystem(): Promise<void> {
    console.log('\n🔔 Testing Notification System...');

    await this.testEndpoint(
      'GET /notifications',
      'GET',
      () => CommunicationAPI.getNotifications({ page: 1, limit: 10 })
    );

    await this.testEndpoint(
      'GET /notifications/count',
      'GET',
      () => CommunicationAPI.getNotificationCount()
    );

    await this.testEndpoint(
      'PUT /notifications/:id/read',
      'PUT',
      () => CommunicationAPI.markNotificationAsRead('test-notification-id')
    );

    await this.testEndpoint(
      'PUT /notifications/read-all',
      'PUT',
      () => CommunicationAPI.markAllNotificationsAsRead()
    );

    await this.testEndpoint(
      'DELETE /notifications/:id',
      'DELETE',
      () => CommunicationAPI.deleteNotification('test-notification-id')
    );
  }

  private static async testCommunicationChannels(): Promise<void> {
    console.log('\n📧 Testing Communication Channels...');

    await this.testEndpoint(
      'POST /notifications/email',
      'POST',
      () => CommunicationAPI.sendEmailNotification(
        'test@example.com',
        'Test Subject',
        'Test email content',
        'default'
      )
    );

    await this.testEndpoint(
      'POST /notifications/sms',
      'POST',
      () => CommunicationAPI.sendSmsNotification(
        '+1234567890',
        'Test SMS message',
        'default'
      )
    );
  }

  // Real-time communication tests
  static async testRealtimeFeatures(): Promise<void> {
    console.log('\n🔄 Testing Real-time Features...');

    try {
      // Test EventSource connection
      RealtimeCommunication.connect();
      console.log('✅ EventSource connection established');

      // Test typing indicators
      await RealtimeCommunication.sendTyping('test-conversation-id', 'start');
      console.log('✅ Typing start event sent');

      await RealtimeCommunication.sendTyping('test-conversation-id', 'stop');
      console.log('✅ Typing stop event sent');

      // Clean up
      RealtimeCommunication.disconnect();
      console.log('✅ EventSource connection closed');

    } catch (error) {
      console.log(`❌ Real-time features test failed: ${error}`);
    }
  }

  // Performance testing
  static async testPerformance(): Promise<void> {
    console.log('\n⚡ Testing Performance...');

    const iterations = 10;
    const results: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      try {
        await CommunicationAPI.getConversations({ page: 1, limit: 5 });
        results.push(Date.now() - start);
      } catch (error) {
        console.log(`Performance test iteration ${i + 1} failed: ${error}`);
      }
    }

    if (results.length > 0) {
      const avgTime = results.reduce((a, b) => a + b, 0) / results.length;
      const minTime = Math.min(...results);
      const maxTime = Math.max(...results);

      console.log(`📊 Performance Results:`);
      console.log(`   Average: ${avgTime.toFixed(2)}ms`);
      console.log(`   Min: ${minTime}ms`);
      console.log(`   Max: ${maxTime}ms`);
    }
  }

  // Generate test report
  static generateReport(): string {
    const { total, passed, failed } = this.testResults.reduce(
      (acc, result) => {
        acc.total++;
        if (result.status === 'pass') acc.passed++;
        if (result.status === 'fail') acc.failed++;
        return acc;
      },
      { total: 0, passed: 0, failed: 0 }
    );

    const report = `
# Communication API Test Report

## Summary
- **Total Tests**: ${total}
- **Passed**: ${passed} ✅
- **Failed**: ${failed} ❌
- **Success Rate**: ${((passed / total) * 100).toFixed(1)}%

## Detailed Results

${this.testResults.map(result => `
### ${result.method} ${result.endpoint}
- **Status**: ${result.status === 'pass' ? '✅ PASSED' : '❌ FAILED'}
- **Duration**: ${result.duration}ms
${result.error ? `- **Error**: ${result.error}` : ''}
`).join('')}

## Recommendations
${failed > 0 ? `
⚠️ **Action Required**: ${failed} test(s) failed. Please review the error messages above and fix the corresponding endpoints.
` : `
🎉 **All tests passed!** The communication system is fully functional.
`}
`;

    return report;
  }
}

// Utility function to run tests from browser console
export const runCommunicationTests = async () => {
  const results = await CommunicationTestSuite.runAllTests();
  console.log(CommunicationTestSuite.generateReport());
  return results;
};

// Export for use in development
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).runCommunicationTests = runCommunicationTests;
}

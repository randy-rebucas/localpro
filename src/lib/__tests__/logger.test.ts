/**
 * Logger Utility Tests
 * Tests for the centralized logging utility
 */

import { logger } from '../logger';

describe('Logger', () => {
  // Set NODE_ENV to development for all tests
  const originalEnv = process.env.NODE_ENV;
  
  // Mock console methods - created in beforeAll to override jest.setup.js
  let mockConsoleDebug: jest.Mock;
  let mockConsoleInfo: jest.Mock;
  let mockConsoleWarn: jest.Mock;
  let mockConsoleError: jest.Mock;
  let mockConsoleGroup: jest.Mock;
  let mockConsoleGroupEnd: jest.Mock;
  let mockConsoleTime: jest.Mock;
  let mockConsoleTimeEnd: jest.Mock;
  
  // Store original implementations for restoration
  let originalDebug: typeof console.debug;
  let originalInfo: typeof console.info;
  let originalWarn: typeof console.warn;
  let originalError: typeof console.error;
  let originalGroup: typeof console.group;
  let originalGroupEnd: typeof console.groupEnd;
  let originalTime: typeof console.time;
  let originalTimeEnd: typeof console.timeEnd;

  beforeAll(() => {
    process.env.NODE_ENV = 'development';
    // Set log level to debug to ensure all log levels are enabled in tests
    logger.setLogLevel('debug');
    
    // Get the current console methods (may be wrapped by jest.setup.js)
    originalDebug = console.debug;
    originalInfo = console.info;
    originalWarn = console.warn;
    originalError = console.error;
    originalGroup = console.group;
    originalGroupEnd = console.groupEnd;
    originalTime = console.time;
    originalTimeEnd = console.timeEnd;
    
    // Create jest.fn() mocks that call through to current implementations
    // This ensures Jest tracks calls properly
    mockConsoleDebug = jest.fn(originalDebug);
    mockConsoleInfo = jest.fn(originalInfo);
    mockConsoleWarn = jest.fn(originalWarn);
    mockConsoleError = jest.fn(originalError);
    mockConsoleGroup = jest.fn(originalGroup);
    mockConsoleGroupEnd = jest.fn(originalGroupEnd);
    mockConsoleTime = jest.fn(originalTime);
    mockConsoleTimeEnd = jest.fn(originalTimeEnd);
    
    // Replace console methods with our tracked mocks
    console.debug = mockConsoleDebug;
    console.info = mockConsoleInfo;
    console.warn = mockConsoleWarn;
    console.error = mockConsoleError;
    console.group = mockConsoleGroup;
    console.groupEnd = mockConsoleGroupEnd;
    console.time = mockConsoleTime;
    console.timeEnd = mockConsoleTimeEnd;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure log level is debug for each test
    logger.setLogLevel('debug');
  });

  afterAll(() => {
    // Restore console methods to their original implementations
    console.debug = originalDebug;
    console.info = originalInfo;
    console.warn = originalWarn;
    console.error = originalError;
    console.group = originalGroup;
    console.groupEnd = originalGroupEnd;
    console.time = originalTime;
    console.timeEnd = originalTimeEnd;
    // Restore NODE_ENV and log level
    process.env.NODE_ENV = originalEnv;
    logger.setLogLevel(originalEnv === 'development' ? 'debug' : 'warn');
  });

  describe('debug', () => {
    it('should log debug messages in development', () => {
      logger.debug('Test debug message');
      expect(mockConsoleDebug).toHaveBeenCalled();
    });

    it('should include context in debug messages', () => {
      logger.debug('Test message', { userId: '123', action: 'login' });
      expect(mockConsoleDebug).toHaveBeenCalledWith(
        expect.stringContaining('Test message')
      );
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Test info message');
      expect(mockConsoleInfo).toHaveBeenCalled();
    });

    it('should include context in info messages', () => {
      logger.info('User logged in', { userId: '123' });
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('User logged in')
      );
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Test warning message');
      expect(mockConsoleWarn).toHaveBeenCalled();
    });

    it('should include context in warning messages', () => {
      logger.warn('Deprecated API used', { endpoint: '/old/api' });
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Deprecated API used')
      );
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      const error = new Error('Test error');
      logger.error('Something went wrong', error);
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should include error stack in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');
      logger.error('Error occurred', error, { context: 'test' });
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error occurred')
      );
    });
  });

  describe('group', () => {
    it('should create console groups in development', () => {
      process.env.NODE_ENV = 'development';
      logger.group('Test Group', () => {
        logger.info('Inside group');
      });

      expect(mockConsoleGroup).toHaveBeenCalledWith('Test Group');
      expect(mockConsoleGroupEnd).toHaveBeenCalled();
    });
  });

  describe('time tracking', () => {
    it('should track time in development', () => {
      process.env.NODE_ENV = 'development';
      logger.setLogLevel('debug');

      logger.time('test-timer');
      logger.timeEnd('test-timer');

      expect(mockConsoleTime).toHaveBeenCalledWith('test-timer');
      expect(mockConsoleTimeEnd).toHaveBeenCalledWith('test-timer');
    });
  });
});

/**
 * Centralized Logging Utility
 * Replaces console.log statements with structured logging
 * Provides log levels, context, and production-safe logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  error?: Error;
}

class Logger {
  private get isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }
  private isClient = typeof window !== 'undefined';
  private logLevel: LogLevel;

  constructor() {
    // Set log level based on environment
    const envLogLevel = process.env.NEXT_PUBLIC_LOG_LEVEL?.toLowerCase() as LogLevel;
    this.logLevel = envLogLevel || (this.isDevelopment ? 'debug' : 'warn');
  }

  // Allow setting log level for testing
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error): string {
    const prefix = `[${level.toUpperCase()}]`;
    const timestamp = new Date().toISOString();
    
    // Safely stringify context, handling non-serializable values
    let contextStr = '';
    if (context) {
      try {
        contextStr = ` ${JSON.stringify(context, (key, value) => {
          // Handle non-serializable values
          if (value && typeof value === 'object') {
            // Check for ObjectId-like objects (MongoDB ObjectId)
            if (value.constructor && (
              value.constructor.name === 'ObjectId' || 
              (typeof value.toString === 'function' && key === '_id')
            )) {
              try {
                return value.toString();
              } catch {
                return '[ObjectId]';
              }
            }
            // Handle Date objects
            if (value instanceof Date) {
              return value.toISOString();
            }
          }
          // Handle circular references and functions
          if (typeof value === 'function') {
            return '[Function]';
          }
          if (typeof value === 'undefined') {
            return '[undefined]';
          }
          return value;
        })}`;
      } catch (e) {
        contextStr = ` [Context serialization failed: ${e instanceof Error ? e.message : String(e)}]`;
      }
    }
    
    // Safely extract error message - don't access error.message directly as it might trigger ObjectId serialization
    let errorStr = '';
    if (error) {
      try {
        // Try to get message safely
        const errorMessage = error.message || 'Unknown error';
        errorStr = ` Error: ${errorMessage}`;
      } catch {
        // If accessing error.message fails, use a safe fallback
        try {
          errorStr = ` Error: ${String(error)}`;
        } catch {
          errorStr = ' Error: [Error details unavailable]';
        }
      }
    }
    
    return `${prefix} ${timestamp} ${message}${contextStr}${errorStr}`;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      error,
    };
  }

  private sendToSentry(entry: LogEntry): void {
    // Only send to Sentry on client side
    if (!this.isClient) {
      return;
    }
    
    // Sentry is typically configured at the app level
    // This is a placeholder for integration
    interface WindowWithSentry extends Window {
      Sentry?: {
        captureException: (error: Error, options?: { contexts?: { log?: Record<string, unknown> }; level?: string }) => void;
        captureMessage: (message: string, options?: { level?: string; contexts?: { log?: Record<string, unknown> } }) => void;
      };
    }
    
    // Double-check window exists before accessing (defensive programming)
    if (typeof window !== 'undefined') {
      const windowWithSentry = window as WindowWithSentry;
      if (windowWithSentry.Sentry) {
        if (entry.level === 'error' && entry.error) {
          windowWithSentry.Sentry.captureException(entry.error, {
            contexts: { log: entry.context },
            level: entry.level,
          });
        } else {
          windowWithSentry.Sentry.captureMessage(entry.message, {
            level: entry.level,
            contexts: { log: entry.context },
          });
        }
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;

    // Entry created for potential future error tracking integration
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _entry = this.createLogEntry('debug', message, context);
    
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
    
    // Debug logs typically don't go to error tracking
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;

    // Entry created for potential future error tracking integration
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _entry = this.createLogEntry('info', message, context);
    
    if (this.isDevelopment || this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;

    const entry = this.createLogEntry('warn', message, context);
    console.warn(this.formatMessage('warn', message, context));
    
    // Warnings can be sent to monitoring in production
    if (!this.isDevelopment) {
      this.sendToSentry(entry);
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog('error')) return;

    // Safely extract error message as a string BEFORE any serialization
    // This prevents ObjectId serialization issues
    let errorMessageStr = '';
    let errorStackStr = '';
    
    if (error) {
      try {
        // Extract message as string - wrap in try-catch in case accessing .message triggers issues
        errorMessageStr = (error as { message?: string }).message || 'Unknown error';
      } catch {
        try {
          errorMessageStr = String(error);
        } catch {
          errorMessageStr = 'Error occurred (details unavailable)';
        }
      }
      
      try {
        // Extract stack as string
        errorStackStr = (error as { stack?: string }).stack || '';
      } catch {
        // Ignore stack extraction errors
      }
    }

    // Create a completely clean error object with only string properties
    let safeError: Error | undefined;
    if (errorMessageStr) {
      try {
        safeError = new Error(errorMessageStr);
        if (errorStackStr) {
          safeError.stack = errorStackStr;
        }
      } catch {
        // If creating error fails, use minimal error
        safeError = new Error('Error occurred');
      }
    }

    const entry = this.createLogEntry('error', message, context, safeError);
    
    // Format message with error message string instead of error object
    // Don't pass error object at all - just pass the message string
    try {
      // Build the formatted message manually to avoid any ObjectId serialization
      const prefix = '[ERROR]';
      const timestamp = new Date().toISOString();
      
      // Safely stringify context
      let contextStr = '';
      if (context) {
        try {
          contextStr = ` ${JSON.stringify(context, (key, value) => {
            if (value && typeof value === 'object') {
              if (value.constructor && value.constructor.name === 'ObjectId') {
                try {
                  return value.toString();
                } catch {
                  return '[ObjectId]';
                }
              }
              if (value instanceof Date) {
                return value.toISOString();
              }
            }
            if (typeof value === 'function') {
              return '[Function]';
            }
            if (typeof value === 'undefined') {
              return '[undefined]';
            }
            return value;
          })}`;
        } catch {
          contextStr = ' [Context unavailable]';
        }
      }
      
      const errorStr = errorMessageStr ? ` Error: ${errorMessageStr}` : '';
      const formattedMessage = `${prefix} ${timestamp} ${message}${contextStr}${errorStr}`;
      console.error(formattedMessage);
    } catch {
      // Ultimate fallback if everything fails
      console.error(`[ERROR] ${new Date().toISOString()} ${message}${errorMessageStr ? ` Error: ${errorMessageStr}` : ''}`);
    }
    
    // Always send errors to monitoring
    this.sendToSentry(entry);
    
    // Log error details in development
    if (this.isDevelopment && errorMessageStr) {
      try {
        if (errorStackStr) {
          console.error('Error stack:', errorStackStr);
        }
        if (context) {
          // Safely log context
          try {
            console.error('Error context:', JSON.stringify(context, (key, value) => {
              if (value && typeof value === 'object' && value.constructor?.name === 'ObjectId') {
                return value.toString();
              }
              return value;
            }));
          } catch {
            console.error('Error context: [Unable to serialize]');
          }
        }
      } catch {
        // Silently fail if logging error details causes issues
      }
    }
  }

  // Grouped logging for related messages
  group(label: string, callback: () => void): void {
    if (this.isDevelopment) {
      console.group(label);
      try {
        callback();
      } finally {
        console.groupEnd();
      }
    } else {
      callback();
    }
  }

  // Time tracking for performance
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  // Table formatting for objects/arrays
  table(data: unknown): void {
    if (this.isDevelopment) {
      console.table(data);
    }
  }
}

// Create singleton instance
export const logger = new Logger();

// Convenience exports
export const log = logger;
export default logger;


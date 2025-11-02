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
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    const errorStr = error ? ` Error: ${error.message}` : '';
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
    if (!this.isClient || !this.isDevelopment) {
      // Sentry is typically configured at the app level
      // This is a placeholder for integration
      interface WindowWithSentry extends Window {
        Sentry?: {
          captureException: (error: Error, options?: { contexts?: { log?: Record<string, unknown> }; level?: string }) => void;
          captureMessage: (message: string, options?: { level?: string; contexts?: { log?: Record<string, unknown> } }) => void;
        };
      }
      const windowWithSentry = window as WindowWithSentry;
      if (typeof window !== 'undefined' && windowWithSentry.Sentry) {
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

    const entry = this.createLogEntry('error', message, context, error);
    console.error(this.formatMessage('error', message, context, error));
    
    // Always send errors to monitoring
    this.sendToSentry(entry);
    
    // Log error details in development
    if (this.isDevelopment && error) {
      console.error('Error stack:', error.stack);
      if (context) {
        console.error('Error context:', context);
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


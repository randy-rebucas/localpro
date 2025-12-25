/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/admin/types-logs' instead.
 */
export * from '@/features/admin/types-logs';
import type { LogLevel } from '@/features/admin/types-logs';
export type LogCategory =
  | "application"
  | "http"
  | "error"
  | "performance"
  | "business"
  | "security"
  | "audit"
  | "system";
export type LogSource = "winston" | "audit" | "error_monitoring" | "request_logger" | "manual";
export type Timeframe = "1h" | "24h" | "7d" | "30d";

export interface Request {
  method?: string;
  url?: string;
  headers?: Record<string, unknown>;
  body?: Record<string, unknown>;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  userId?: string;
}

export interface Response {
  statusCode?: number;
  responseTime?: number;
  success?: boolean;
}

export interface Error {
  name?: string;
  message?: string;
  stack?: string;
  code?: string;
  statusCode?: number;
}

export interface Log {
  _id?: string;
  logId: string;
  level: LogLevel;
  message: string;
  category?: LogCategory;
  source?: LogSource;
  request?: Request;
  response?: Response;
  error?: Error;
  metadata?: Record<string, unknown>;
  environment?: string;
  timestamp?: Date;
  retentionDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

# Logs API Endpoints

Base path: `/api/logs` (auth required; admin-only for most)

## Core Endpoints

### GET `/stats` [admin]
Query: `timeframe='1h'|'24h'|'7d'|'30d'`
Returns aggregated log counts by level and category.

### GET `/` [admin]
Query filters: `level, category, source, startDate, endDate, userId, url, method, statusCode, search, page=1, limit<=100, sortBy='timestamp', sortOrder='desc'`
Returns paginated logs.

### GET `/:logId` [admin]
Returns a specific log by `logId`.

---

## Analytics Endpoints

### GET `/analytics/error-trends` [admin]
Query: `timeframe='7d'|...`
Returns error name counts and messages.

### GET `/analytics/performance` [admin]
Query: `timeframe='24h'|...`
Returns URL-level performance metrics (avg/max/min response times, count).

---

## Configuration Management

### GET `/config` [admin]
Returns the current logger configuration including:
- Global log level
- Module-specific overrides
- Retention settings
- Enabled categories
- Output formats

### PUT `/config/level` [admin]
Body: `{ level: 'debug'|'info'|'warn'|'error'|'fatal' }`
Sets the global log level for all modules.

### PUT `/config/override` [admin]
Body: `{ context: string, level: LogLevel, expiresAt?: string }`
Sets a module-specific log level override. Optional expiration time.

### DELETE `/config/override/:context` [admin]
Removes a module-specific log level override.

---

## Metrics & Statistics

### GET `/metrics` [admin]
Returns real-time log metrics including:
- Total logs count
- Logs per second/minute
- Error and warning rates
- Counts by level and category
- Buffer and memory usage
- Uptime and timestamp

### POST `/metrics/reset` [admin]
Resets all log metrics counters to zero.

### GET `/statistics` [admin]
Query: `period='24h'|'7d'|'30d', startDate, endDate`
Returns comprehensive log statistics including:
- Total logs and unique users/sessions
- Breakdown by level, category, source
- Hourly and daily distributions
- Top endpoints and errors
- Response time percentiles (p50, p95, p99)
- Error trends over time

### GET `/slow-operations` [admin]
Query: `threshold=1000, limit=50, startDate, endDate, endpoint`
Returns slow operations that exceeded the threshold (default: 1000ms).

---

## Correlation & Query

### GET `/correlation/:correlationId` [admin]
Returns all logs associated with a specific correlation ID, ordered by sequence.
Useful for tracing request flows across services.

### GET `/errors/summary` [admin]
Query: `startDate, endDate, groupBy='type'|'endpoint'|'statusCode'`
Returns error summary with grouping including:
- Total and unique error counts
- Errors by type, endpoint, status code
- Recent error details with stack traces
- Error trends over time

### GET `/query` [admin]
Advanced log query with extensive filters:
- **Basic**: level, category, source (arrays supported)
- **Time**: startDate, endDate
- **Text**: search, searchFields, regex
- **User**: userId, sessionId, requestId, correlationId
- **Request**: method, endpoint, statusCode, minDuration, maxDuration
- **Error**: errorType, hasError
- **Metadata**: metadataKey, metadataValue
- **Pagination**: page, limit, sortBy, sortOrder
- **Aggregation**: groupBy, aggregate ('count'|'avg'|'sum'|'min'|'max')

---

## User Activity

### GET `/user/:userId/activity` [admin or self]
Query: `timeframe='7d'|...`
Returns activity logs for a user.

---

## Export & Maintenance

### GET `/export/data` [admin]
Query: same filters as list plus `format='json'|'csv'`
Returns JSON or CSV export.

### POST `/cleanup` [admin]
Triggers cleanup of expired logs.

### POST `/flush` [admin]
Body: `{ type: 'all'|'database'|'files' }`
Flushes logs from DB/files.

### DELETE `/flush` [admin]
Flushes all logs (alternative endpoint).

---

## Errors
- 400 invalid params
- 403 forbidden (non-admin)
- 404 not found
- 500 server error

// Browser-compatible logger for Next.js app
interface LogEntry {
  level: 'info' | 'error' | 'debug' | 'warn';
  message: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

class Logger {
  private log(entry: LogEntry): void {
    const logMessage = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
    
    if (entry.meta) {
      console.log(logMessage, entry.meta);
    } else {
      console.log(logMessage);
    }

    // In production, you might want to send logs to an external service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to external logging service
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      meta,
    });
  }

  error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    const errorMeta = {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...meta,
    };

    this.log({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      meta: errorMeta,
    });
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'development') {
      this.log({
        level: 'debug',
        message,
        timestamp: new Date().toISOString(),
        meta,
      });
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      meta,
    });
  }
}

export const log = new Logger();
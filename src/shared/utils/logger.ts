import { env } from '../config/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

function formatEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
}

function write(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const entry = formatEntry(level, message, meta);

  if (env.NODE_ENV === 'production') {
    // JSON structured output for log aggregators (Datadog, CloudWatch, etc.)
    process.stdout.write(JSON.stringify(entry) + '\n');
  } else {
    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // cyan
      info:  '\x1b[32m', // green
      warn:  '\x1b[33m', // yellow
      error: '\x1b[31m', // red
    };
    const reset = '\x1b[0m';
    const prefix = `${colors[level]}[${level.toUpperCase()}]${reset}`;
    const metaStr = meta ? ' ' + JSON.stringify(meta) : '';
    // eslint-disable-next-line no-console
    console.log(`${entry.timestamp} ${prefix} ${message}${metaStr}`);
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (env.NODE_ENV !== 'production') write('debug', message, meta);
  },
  info: (message: string, meta?: Record<string, unknown>) => write('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write('error', message, meta),
};

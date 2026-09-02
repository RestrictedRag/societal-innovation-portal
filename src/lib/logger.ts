export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  problemId?: string;
  step?: string;
  durationMs?: number;
  attempt?: number;
  [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...(context ?? {}),
  };

  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => formatLog('debug', message, context),
  info: (message: string, context?: LogContext) => formatLog('info', message, context),
  warn: (message: string, context?: LogContext) => formatLog('warn', message, context),
  error: (message: string, context?: LogContext) => formatLog('error', message, context),
};

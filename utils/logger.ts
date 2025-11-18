import { storage, STORAGE_KEYS } from './storage';

interface LogEvent {
  event: string;
  timestamp: number;
  data?: Record<string, any>;
}

const MAX_LOG_ENTRIES = 100;

export function logEvent(event: string, data?: Record<string, any>) {
  const logEntry: LogEvent = {
    event,
    timestamp: Date.now(),
    data,
  };

  if (__DEV__) {
    console.log('[OfflineLog]', logEntry);
  }

  try {
    const existingLogs = storage.getString(STORAGE_KEYS.CONNNECTIVITY_LOG);
    const logs: LogEvent[] = existingLogs ? JSON.parse(existingLogs) : [];

    logs.push(logEntry);

    const trimmedLogs = logs.slice(-MAX_LOG_ENTRIES);

    storage.set(STORAGE_KEYS.CONNNECTIVITY_LOG, JSON.stringify(trimmedLogs));
  } catch (error) {
    console.error('Failed to log event:', error);
  }
}

export function getLogs(): LogEvent[] {
  try {
    const logsString = storage.getString(STORAGE_KEYS.CONNNECTIVITY_LOG);
    return logsString ? JSON.parse(logsString) : [];
  } catch (error) {
    console.error('Failed to get logs:', error);
    return [];
  }
}

export function clearLogs() {
  storage.remove(STORAGE_KEYS.CONNNECTIVITY_LOG);
}

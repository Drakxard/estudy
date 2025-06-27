import { promises as fs } from 'fs';
import { join } from 'path';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'debug';
  event: string;
  data?: any;
}

class Logger {
  private logPath: string;

  constructor() {
    this.logPath = join(process.cwd(), 'log.txt');
  }

  private async writeLog(entry: LogEntry) {
    try {
      const logLine = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.event}${entry.data ? ` - ${JSON.stringify(entry.data)}` : ''}\n`;
      await fs.appendFile(this.logPath, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  async info(event: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      event,
      data
    };
    console.log(`INFO: ${event}`, data || '');
    await this.writeLog(entry);
  }

  async error(event: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      event,
      data
    };
    console.error(`ERROR: ${event}`, data || '');
    await this.writeLog(entry);
  }

  async debug(event: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'debug',
      event,
      data
    };
    console.log(`DEBUG: ${event}`, data || '');
    await this.writeLog(entry);
  }
}

export const logger = new Logger();
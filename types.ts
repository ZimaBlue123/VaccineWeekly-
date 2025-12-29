export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export interface AppConfig {
  webhookUrl: string;
  autoMode: boolean;
  lastRun: string | null;
}

export enum BotStatus {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  GENERATING = 'GENERATING',
  REVIEWING = 'REVIEWING',
  SENDING = 'SENDING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
  WAITING = 'WAITING'
}
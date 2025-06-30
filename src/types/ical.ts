
export interface ICalCalendar {
  id: string;
  name: string;
  url: string;
  color: string;
  enabled: boolean;
  lastSync?: string;
  eventCount?: number;
  hasEvents?: boolean;
  source?: string;
}

export interface SyncStatus {
  [calendarId: string]: 'syncing' | 'success' | 'error' | '';
}

export interface UpdateInfo {
  version: string;
  releaseNotes?: string;
  buildDate?: string;
  gitHash?: string;
}

export interface VersionInfo {
  version: string;
  buildDate?: string;
  gitHash?: string;
  buildNumber?: number;
  environment?: string;
}

export interface SyncData {
  status: 'pending' | 'syncing' | 'complete' | 'error';
  calendarId: string;
  timestamp: number;
  error?: string;
}

export interface ICalEvent {
  summary: string;
  dtstart: string;
  dtend?: string;
  description?: string;
  location?: string;
  uid: string;
}

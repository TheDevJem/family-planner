export type Recurrence = 'none' | 'daily' | 'weekly';

export interface PointsHistoryEntry {
  delta: number;
  reason: string;
  timestamp: string;
}

export interface Child {
  id: number;
  name: string;
  age: number;
  birthday: string;
  points_total: number;
  avatar_url: string;
  points_history: PointsHistoryEntry[];
}

export interface Chore {
  id: number;
  name: string;
  minimum_age: number;
  points: number;
  recurrence: Recurrence;
  color: string;
  fixed_child_id: number | null;
}

export interface Assignment {
  id: number;
  child_id: number;
  chore_id: number;
  due_date: string;
  completed: boolean;
  completion_timestamp: string | null;
  points_awarded: number;
}

export interface CalendarSubscription {
  id: number;
  name: string;
  type: 'google' | 'ics';
  url: string;
  color: string;
  enabled: boolean;
  last_synced_at: string | null;
}

export interface CalendarEvent {
  id: string;
  source: 'google' | 'ics';
  subscription_id: number | null;
  title: string;
  start: string;
  end: string;
  all_day: boolean;
  color: string;
}

export interface PasscodeRecord {
  hash: string;
  salt: string;
}

export interface AssignmentView extends Assignment {
  chore_name: string;
  chore_color: string;
  child_name: string;
  avatar_url: string;
}

export type GoalFrequency = 'daily' | 'weekly' | 'monthly';
export type GoalType = 'checkbox' | 'numeric' | 'duration';
export type GoalStatus = 'red' | 'yellow' | 'green';
export type ReflectionType = 'weekly' | 'monthly';

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  frequency: GoalFrequency;
  type: GoalType;
  target_value: number | null;
  category: string | null;
  position: number;
  is_archived: boolean;
  created_at: string;
}

export interface GoalEntry {
  id: string;
  user_id: string;
  goal_id: string;
  date: string;
  value: number;
  status: GoalStatus;
  created_at: string;
}

export interface DashboardLayout {
  id: string;
  user_id: string;
  layout_json: LayoutConfig;
  created_at: string;
}

export interface Reflection {
  id: string;
  user_id: string;
  type: ReflectionType;
  content: string;
  date: string;
  created_at: string;
}

export interface LayoutConfig {
  widgets: WidgetConfig[];
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  visible: boolean;
  position: number;
}

export type WidgetType =
  | 'checklist'
  | 'daily-pie'
  | 'weekly-pie'
  | 'monthly-pie'
  | 'quick-stats';

export interface StartupEntry {
  date: string;
  minutesWorked: number;
  revenue: number;
  tasksCompleted: number;
}

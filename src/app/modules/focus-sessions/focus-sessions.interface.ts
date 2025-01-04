export interface FocusSession {
  id: string;
  userId: string;
  duration: number;
  status: "COMPLETED" | "INTERRUPTED" | "PAUSED";
  timestamp: Date;
  mood?: number;
  notes?: string;
}

export interface FocusMetrics {
  totalFocusTime: number;
  sessionsCompleted: number;
  averageSessionDuration: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  startDate?: Date;
}

export interface Badge {
  id: string;
  userId: string;
  category: "STREAK" | "MILESTONE" | "TIME" | "CONSISTENCY" | "SPECIAL";
  level: number;
  name: string;
  description: string;
  icon: string;
  awardedAt: Date;
}

export interface DailyStat {
  totalMinutes: number;
  sessionsCount: number;
}

export interface DashboardSummary {
  currentStreak: number;
  totalSessions: number;
  totalMinutes: number;
  totalBadges: number;
  recentSessions: FocusSession[];
  dailyStats: Record<string, DailyStat>;
  lastUpdated: Date;
}

export interface FocusPatternAnalysis {
  timePatterns: Record<string, number>;
  dayPatterns: Record<string, number>;
  completionRates: Record<string, number>;
  totalSessions: number;
  averageDuration: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface IFocusSessionPayload {
  duration: number;
}

export interface IBadgeCriteria {
  focusSessions?: number;
  totalMinutes?: number;
  currentStreak?: number;
  consistency?: number;
}

export type TimeRange = "daily" | "weekly" | "monthly";

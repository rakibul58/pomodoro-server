import { BadgeCategory } from "@prisma/client";

export const BADGE_DEFINITIONS = {
  [BadgeCategory.STREAK]: [
    {
      level: 1,
      name: "Momentum Starter",
      description: "Achieved a 3-day focus streak",
      criteria: { currentStreak: 3 },
      icon: "streak-bronze",
    },
    {
      level: 2,
      name: "Rhythm Keeper",
      description: "Maintained a 7-day focus streak",
      criteria: { currentStreak: 7 },
      icon: "streak-silver",
    },
    {
      level: 3,
      name: "Consistency Champion",
      description: "Incredible 14-day focus streak",
      criteria: { currentStreak: 14 },
      icon: "streak-gold",
    },
    {
      level: 4,
      name: "Focus Legend",
      description: "Legendary 30-day focus streak",
      criteria: { currentStreak: 30 },
      icon: "streak-diamond",
    },
  ],
  [BadgeCategory.MILESTONE]: [
    {
      level: 1,
      name: "First Steps",
      description: "Completed 1 focus sessions",
      criteria: { focusSessions: 1 },
      icon: "milestone-bronze",
    },
    {
      level: 2,
      name: "First Steps",
      description: "Completed 2 focus sessions",
      criteria: { focusSessions: 2 },
      icon: "milestone-bronze",
    },
    {
      level: 3,
      name: "First Steps",
      description: "Completed 3 focus sessions",
      criteria: { focusSessions: 3 },
      icon: "milestone-bronze",
    },
    {
      level: 4,
      name: "First Steps",
      description: "Completed 4 focus sessions",
      criteria: { focusSessions: 4 },
      icon: "milestone-bronze",
    },
    {
      level: 5,
      name: "First Steps",
      description: "Completed 5 focus sessions",
      criteria: { focusSessions: 5 },
      icon: "milestone-bronze",
    },
    {
      level: 6,
      name: "Focus Explorer",
      description: "Completed 10 focus sessions",
      criteria: { focusSessions: 10 },
      icon: "milestone-silver",
    },
    {
      level: 7,
      name: "Dedication Master",
      description: "Completed 50 focus sessions",
      criteria: { focusSessions: 50 },
      icon: "milestone-gold",
    },
    {
      level: 8,
      name: "Focus Virtuoso",
      description: "Completed 100 focus sessions",
      criteria: { focusSessions: 100 },
      icon: "milestone-diamond",
    },
  ],
  [BadgeCategory.TIME]: [
    {
      level: 1,
      name: "Time Tracker",
      description: "Accumulated 120 minutes of focus time",
      criteria: { totalMinutes: 120 },
      icon: "time-bronze",
    },
    {
      level: 2,
      name: "Time Warrior",
      description: "Accumulated 600 minutes of focus time",
      criteria: { totalMinutes: 600 },
      icon: "time-silver",
    },
    {
      level: 3,
      name: "Time Master",
      description: "Accumulated 1800 minutes of focus time",
      criteria: { totalMinutes: 1800 },
      icon: "time-gold",
    },
    {
      level: 4,
      name: "Time Lord",
      description: "Accumulated 6000 minutes of focus time",
      criteria: { totalMinutes: 6000 },
      icon: "time-diamond",
    },
  ],
  [BadgeCategory.SPECIAL]: [
    {
      level: 1,
      name: "Early Bird",
      description: "Completed 5 focus sessions before 9 AM",
      criteria: { earlyBird: 5 },
      icon: "special-earlybird",
    },
    {
      level: 2,
      name: "Night Owl",
      description: "Completed 5 focus sessions after 9 PM",
      criteria: { nightOwl: 5 },
      icon: "special-nightowl",
    },
  ],
};

export const CACHE_DURATIONS = {
  FOCUS_SESSION: 300,
  DASHBOARD: 180,
  METRICS: 300,
  STREAKS: 300,
  BADGES: 300,
};

export const FOCUS_LEVEL_THRESHOLDS = {
  BEGINNER: 0,
  INTERMEDIATE: 2,
  ADVANCED: 4,
  EXPERT: 7,
  MASTER: 12,
};

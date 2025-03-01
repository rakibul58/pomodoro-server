import { JwtPayload } from "jsonwebtoken";
import {
  IBadgeCriteria,
  IFocusSessionPayload,
  TimeRange,
} from "./focus-sessions.interface";
import prisma from "../../../shared/prisma";
import { getOrSet } from "../../../helpers/redisCache";
import { BadgeCategory, FocusLevel, Prisma } from "@prisma/client";
import {
  BADGE_DEFINITIONS,
  CACHE_DURATIONS,
  FOCUS_LEVEL_THRESHOLDS,
} from "./focus-sessions.constants";
import { invalidateUserCaches } from "./focus-sessions.utlis";

const createFocusSession = async (
  user: JwtPayload,
  payload: IFocusSessionPayload
) => {
  // First create the session
  const session = await prisma.focusSession.create({
    data: {
      userId: user.id,
      duration: payload.duration,
    },
  });

  // Process the rest asynchronously
  Promise.all([
    updateStreak(user.id),
    checkAndAwardBadges(user.id),
    invalidateUserCaches(user.id),
  ]).catch(console.error);

  return session;
};

const getFocusMetrics = async (
  user: JwtPayload,
  query: Record<string, unknown>
) => {
  const { range = "weekly" } = query;
  const cacheKey = `focus-metrics:${user.id}:${range}`;

  const metrics = await getOrSet(
    cacheKey,
    async () => {
      const endDate = new Date();
      const startDate = new Date();

      // Set the appropriate date range
      switch (range as TimeRange) {
        case "daily":
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "weekly":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "monthly":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        default:
          throw new Error(
            "Invalid range specified. Use 'daily', 'weekly', or 'monthly'"
          );
      }

      const sessions = await prisma.focusSession.findMany({
        where: {
          userId: user.id,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          timestamp: "desc",
        },
      });

      const totalFocusTime = sessions.reduce(
        (sum, session) => sum + session.duration,
        0
      );

      return {
        totalFocusTime,
        sessionsCompleted: sessions.length,
        averageSessionDuration:
          sessions.length > 0 ? totalFocusTime / sessions.length : 0,
        startDate,
        endDate,
      };
    },
    CACHE_DURATIONS.METRICS
  );

  return metrics;
};

const getBadges = async (user: JwtPayload) => {
  const cacheKey = `badges:${user.id}`;

  const badges = await getOrSet(
    cacheKey,
    async () => {
      return prisma.badge.findMany({
        where: {
          userId: user.id,
        },
        orderBy: [
          {
            awardedAt: "desc",
          },
        ],
      });
    },
    CACHE_DURATIONS.BADGES
  );

  return badges;
};

const getStreaks = async (user: JwtPayload) => {
  const cacheKey = `streaks:${user.id}`;

  const streakData = await getOrSet(
    cacheKey,
    async () => {
      const [currentStreak, longestStreak] = await Promise.all([
        prisma.streak.findFirst({
          where: { userId: user.id, isActive: true },
          orderBy: { startDate: "desc" },
        }),
        prisma.streak.findFirst({
          where: { userId: user.id },
          orderBy: { currentStreak: "desc" },
        }),
      ]);

      return {
        currentStreak: currentStreak?.currentStreak || 0,
        longestStreak: longestStreak?.currentStreak || 0,
        startDate: currentStreak?.startDate,
      };
    },
    CACHE_DURATIONS.STREAKS
  );

  return streakData;
};

const getDashboardSummary = async (user: JwtPayload) => {
  const cacheKey = `dashboard-summary:${user.id}`;

  const summary = await getOrSet(
    cacheKey,
    async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const [sessions, streak, badges, totalStats] = await Promise.all([
        prisma.focusSession.findMany({
          where: {
            userId: user.id,
            timestamp: { gte: startDate },
          },
          orderBy: { timestamp: "desc" },
        }),
        prisma.streak.findFirst({
          where: { userId: user.id, isActive: true },
        }),
        prisma.badge.findMany({
          where: { userId: user.id },
          orderBy: { awardedAt: "desc" },
        }),
        prisma.focusSession.aggregate({
          where: { userId: user.id },
          _sum: { duration: true },
          _count: true,
        }),
      ]);

      const dailyStats = sessions.reduce((acc, session) => {
        const date = session.timestamp.toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = { totalMinutes: 0, sessionsCount: 0 };
        }
        acc[date].totalMinutes += session.duration;
        acc[date].sessionsCount += 1;
        return acc;
      }, {} as Record<string, { totalMinutes: number; sessionsCount: number }>);

      return {
        currentStreak: streak?.currentStreak || 0,
        totalSessions: totalStats._count,
        totalMinutes: totalStats._sum.duration || 0,
        badges,
        recentSessions: sessions.slice(0, 5),
        dailyStats,
        lastUpdated: new Date(),
      };
    },
    CACHE_DURATIONS.DASHBOARD
  );

  return summary;
};

export const getUserMetrics = async (
  userId: string,
  timezone: string = "UTC" // Add timezone parameter with UTC default
): Promise<IBadgeCriteria> => {
  // Get user's current streak
  const streak = await prisma.streak.findFirst({
    where: {
      userId,
      isActive: true,
    },
  });

  // Get total focus sessions
  const focusSessionCount = await prisma.focusSession.count({
    where: {
      userId,
      status: "COMPLETED",
    },
  });

  // Get total minutes
  const totalMinutes = await prisma.focusSession.aggregate({
    where: {
      userId,
      status: "COMPLETED",
    },
    _sum: {
      duration: true,
    },
  });

  // Use Prisma's datetime functions to convert UTC to local time
  const earlyBirdSessions = await prisma.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*)::int
    FROM "FocusSession"
    WHERE "userId" = ${userId}
      AND status = 'COMPLETED'
      AND EXTRACT(HOUR FROM timestamp AT TIME ZONE ${timezone}) < 9
  `;

  const nightOwlSessions = await prisma.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*)::int
    FROM "FocusSession"
    WHERE "userId" = ${userId}
      AND status = 'COMPLETED'
      AND EXTRACT(HOUR FROM timestamp AT TIME ZONE ${timezone}) >= 21
  `;

  return {
    currentStreak: streak?.currentStreak || 0,
    focusSessions: focusSessionCount,
    totalMinutes: totalMinutes._sum.duration || 0,
    earlyBird: earlyBirdSessions[0].count,
    nightOwl: nightOwlSessions[0].count,
  };
};

const checkAndAwardBadges = async (userId: string) => {
  // Get all metrics in a single query
  const [metrics, existingBadges] = await Promise.all([
    getUserMetrics(userId),
    prisma.badge.findMany({
      where: { userId },
      select: { category: true, level: true },
    }),
  ]);

  // Create a map for quick lookup
  const existingBadgeMap = new Map(
    existingBadges.map((b) => [`${b.category}-${b.level}`, true])
  );

  // Prepare badge creations
  const badgeCreations = [];

  for (const category of Object.keys(BADGE_DEFINITIONS) as BadgeCategory[]) {
    const badges = BADGE_DEFINITIONS[category];
    for (const badge of badges) {
      const badgeKey = `${category}-${badge.level}`;
      if (
        !existingBadgeMap.get(badgeKey) &&
        Object.entries(badge.criteria).every(
          ([key, value]) =>
            (metrics[key as keyof IBadgeCriteria] as number) >= value
        )
      ) {
        badgeCreations.push({
          userId,
          category,
          level: badge.level,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          criteria: badge.criteria as Prisma.JsonObject,
        });
      }
    }
  }

  // Batch create badges if any
  if (badgeCreations.length > 0) {
    await prisma.badge.createMany({
      data: badgeCreations,
      skipDuplicates: true,
    });
  }
};

const updateStreak = async (userId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingStreak = await prisma.streak.findFirst({
    where: { userId, isActive: true },
    orderBy: { startDate: "desc" },
  });

  if (!existingStreak) {
    return await prisma.streak.create({
      data: { userId, startDate: today, currentStreak: 1 },
    });
  }

  const lastActiveDate = new Date(existingStreak.startDate);
  lastActiveDate.setDate(
    lastActiveDate.getDate() + existingStreak.currentStreak - 1
  );

  const daysDifference = Math.floor(
    (today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDifference === 1) {
    return await prisma.streak.update({
      where: { id: existingStreak.id },
      data: { currentStreak: existingStreak.currentStreak + 1 },
    });
  } else if (daysDifference > 1) {
    await prisma.streak.update({
      where: { id: existingStreak.id },
      data: { isActive: false },
    });
    return await prisma.streak.create({
      data: { userId, startDate: today, currentStreak: 1 },
    });
  }

  return existingStreak;
};

export {
  createFocusSession,
  getFocusMetrics,
  getStreaks,
  getDashboardSummary,
  getBadges,
};

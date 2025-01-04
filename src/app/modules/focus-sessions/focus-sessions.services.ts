import { JwtPayload } from "jsonwebtoken";
import {
  IBadgeCriteria,
  IFocusSessionPayload,
  TimeRange,
} from "./focus-sessions.interface";
import prisma from "../../../shared/prisma";
import { getOrSet } from "../../../helpers/redisCache";
import { BadgeCategory, FocusLevel, Prisma } from "@prisma/client";
import { BADGE_DEFINITIONS, CACHE_DURATIONS } from "./focus-sessions.constants";
import { invalidateUserCaches } from "./focus-sessions.utlis";

const createFocusSession = async (
  user: JwtPayload,
  payload: IFocusSessionPayload
) => {
  const session = await prisma.focusSession.create({
    data: {
      userId: user.id,
      duration: payload.duration,
    },
  });

  // Update streak and check for new badges
  await updateStreak(user.id);
  await checkAndAwardBadges(user.id);
  await invalidateUserCaches(user.id);

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

const getUserMetrics = async (userId: string): Promise<IBadgeCriteria> => {
  const cacheKey = `user-metrics:${userId}`;

  return await getOrSet(
    cacheKey,
    async () => {
      const [focusSessions, totalMinutesResult, streak, consistencyDays] =
        await Promise.all([
          prisma.focusSession.count({ where: { userId } }),
          prisma.focusSession.aggregate({
            where: { userId },
            _sum: { duration: true },
          }),
          prisma.streak.findFirst({
            where: { userId, isActive: true },
            orderBy: { startDate: "desc" },
          }),
          prisma.focusSession.groupBy({
            by: ["timestamp"],
            where: {
              userId,
              timestamp: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          }),
        ]);

      return {
        focusSessions,
        totalMinutes: totalMinutesResult._sum.duration || 0,
        currentStreak: streak?.currentStreak || 0,
        consistency: consistencyDays.length,
      };
    },
    CACHE_DURATIONS.METRICS
  );
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

const checkAndAwardBadges = async (userId: string) => {
  const metrics = await getUserMetrics(userId);

  for (const category of Object.keys(BADGE_DEFINITIONS) as BadgeCategory[]) {
    const badges = BADGE_DEFINITIONS[category];

    for (const badge of badges) {
      const qualifies = Object.entries(badge.criteria).every(([key, value]) => {
        return (metrics[key as keyof IBadgeCriteria] as number) >= value;
      });

      if (qualifies) {
        // Check if badge already awarded
        const existingBadge = await prisma.badge.findFirst({
          where: {
            userId,
            category,
            level: badge.level,
          },
        });

        if (!existingBadge) {
          await prisma.badge.create({
            data: {
              userId,
              category,
              level: badge.level,
              name: badge.name,
              description: badge.description,
              icon: badge.icon,
              criteria: badge.criteria as Prisma.JsonObject,
            },
          });
        }
      }
    }
  }

  // Update user focus level based on total badges
  const badgeCount = await prisma.badge.count({
    where: { userId },
  });

  const newLevel =
    badgeCount >= 15
      ? FocusLevel.MASTER
      : badgeCount >= 10
      ? FocusLevel.EXPERT
      : badgeCount >= 6
      ? FocusLevel.ADVANCED
      : badgeCount >= 3
      ? FocusLevel.INTERMEDIATE
      : FocusLevel.BEGINNER;

  await prisma.user.update({
    where: { id: userId },
    data: { focusLevel: newLevel },
  });
};

// Helper service for streak updates
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

import { del } from "../../../helpers/redisCache";

export const invalidateUserCaches = async (userId: string) => {
  const cacheKeys = [
    `focus-metrics:${userId}:daily`,
    `focus-metrics:${userId}:weekly`,
    `focus-metrics:${userId}:monthly`,
    `streaks:${userId}`,
    `dashboard-summary:${userId}`,
    `badges:${userId}`,
    `user-metrics:${userId}`,
  ];
  await Promise.all(cacheKeys.map((key) => del(key)));
};

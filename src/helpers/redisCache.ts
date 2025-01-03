import { createClient, RedisClientType } from "redis";
import config from "../config";

let client: RedisClientType | null = null;

interface RedisConfig {
  username: string;
  password: string;
  socket: {
    host: string;
    port: number;
  };
}

const createRedisClient = (): RedisClientType => {
  const redisConfig: RedisConfig = {
    username: config.redis.username || "default",
    password: config.redis.password || "",
    socket: {
      host: config.redis.host || "",
      port: parseInt(config.redis.port || "6379", 10),
    },
  };

  return createClient(redisConfig);
};

const initializeRedis = async (): Promise<void> => {
  client = createRedisClient();

  client.on("error", (err: Error) => console.log("Redis Client Error:", err));
  client.on("connect", () => console.log("Redis Client Connected"));
  client.on("disconnect", () => console.log("Redis Client Disconnected"));

  try {
    await client.connect();
  } catch (error) {
    console.error("Redis connection error:", error);
    throw error;
  }
};

const disconnect = async (): Promise<void> => {
  try {
    await client?.disconnect();
  } catch (error) {
    console.error("Redis disconnect error:", error);
    throw error;
  }
};

const getOrSet = async <T>(
  key: string,
  callback: () => Promise<T>,
  expiration: number = 3600
): Promise<T> => {
  if (!client) throw new Error("Redis client not initialized");

  try {
    const data = await client.get(key);
    if (data != null) {
      return JSON.parse(data) as T;
    }
    const freshData = await callback();
    await client.setEx(key, expiration, JSON.stringify(freshData));
    return freshData;
  } catch (error) {
    console.error("Redis getOrSet error:", error);
    throw error;
  }
};

const set = async <T>(
  key: string,
  value: T,
  expiration: number | null = null
): Promise<string | null> => {
  if (!client) throw new Error("Redis client not initialized");

  try {
    const serializedValue = JSON.stringify(value);
    if (expiration) {
      return await client.setEx(key, expiration, serializedValue);
    }
    return await client.set(key, serializedValue);
  } catch (error) {
    console.error("Redis set error:", error);
    throw error;
  }
};

const get = async <T>(key: string): Promise<T | null> => {
  if (!client) throw new Error("Redis client not initialized");

  try {
    const value = await client.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch (error) {
    console.error("Redis get error:", error);
    throw error;
  }
};

const del = async (key: string): Promise<number> => {
  if (!client) throw new Error("Redis client not initialized");

  try {
    return await client.del(key);
  } catch (error) {
    console.error("Redis delete error:", error);
    throw error;
  }
};

const exists = async (key: string): Promise<number> => {
  if (!client) throw new Error("Redis client not initialized");

  try {
    return await client.exists(key);
  } catch (error) {
    console.error("Redis exists error:", error);
    throw error;
  }
};

export { initializeRedis, disconnect, getOrSet, set, get, del, exists };

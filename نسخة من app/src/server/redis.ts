import Redis from "ioredis";

let client: Redis | null = null;

export function getRedis() {
  if (client) return client;
  const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";
  client = new Redis(url, { maxRetriesPerRequest: 1 } as any);
  return client as any;
}


import { createClient } from 'redis';
import "dotenv/config";

export const redis = createClient({
    url: process.env.REDIS_URL
});

redis.on('error', err => console.log('Redis Client Error', err));

export async function initRedis(){
    await redis.connect();
    console.log("Redis connection established.")
}
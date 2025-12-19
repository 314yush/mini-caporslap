import { NextResponse } from 'next/server';
import { checkRedisHealth } from '@/lib/redis';

/**
 * GET /api/health
 * Health check endpoint to verify Redis configuration and connection
 */
export async function GET() {
  const redisHealth = await checkRedisHealth();
  
  const health = {
    status: redisHealth.connected ? 'healthy' : 'degraded',
    redis: redisHealth,
    timestamp: new Date().toISOString(),
  };
  
  return NextResponse.json(health, {
    status: redisHealth.configured && redisHealth.connected ? 200 : 503,
  });
}

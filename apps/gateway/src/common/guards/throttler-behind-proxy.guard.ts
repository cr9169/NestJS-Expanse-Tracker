import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

/**
 * Extends ThrottlerGuard to extract the real client IP when behind a reverse proxy.
 * Without this, all clients appear to share the proxy's IP — one user exhausting
 * the rate limit would block all users.
 */
@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected override async getTracker(req: Request): Promise<string> {
    // Trust X-Forwarded-For from known proxy; falls back to direct IP
    const forwarded = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded)
      ? (forwarded[0] ?? req.ip ?? 'unknown')
      : (forwarded?.split(',')[0]?.trim() ?? req.ip ?? 'unknown');
    return Promise.resolve(ip);
  }
}

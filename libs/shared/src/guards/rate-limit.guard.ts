import { Injectable, ExecutionContext, HttpException, HttpStatus, CanActivate } from '@nestjs/common';
import { Request } from 'express';

/**
 * Guard básico de rate limiting usando memoria
 * Limita el número de requests por IP en un período de tiempo
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly requests = new Map<string, { count: number; resetTime: number }>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 5, windowMs: number = 3600000) {
    // Por defecto: 5 requests por hora (3600000 ms)
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Limpiar entradas expiradas cada minuto
    setInterval(() => this.cleanup(), 60000);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(request);
    const now = Date.now();

    // Obtener o crear registro para esta IP
    const record = this.requests.get(ip);

    if (!record || now > record.resetTime) {
      // Primera request o ventana expirada, crear nuevo registro
      this.requests.set(ip, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    // Incrementar contador
    record.count++;

    if (record.count > this.maxRequests) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many requests from this IP. Please try again later.`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /**
   * Obtiene la IP del cliente considerando proxies
   */
  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (request.headers['x-real-ip'] as string) ||
      request.ip ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Limpia entradas expiradas del mapa
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [ip, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(ip);
      }
    }
  }
}


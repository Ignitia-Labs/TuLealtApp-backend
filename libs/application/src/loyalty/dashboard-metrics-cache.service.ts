import { Injectable } from '@nestjs/common';

/**
 * Servicio de caché en memoria para métricas del dashboard
 * Optimiza el rendimiento cacheando resultados de períodos comunes
 */
@Injectable()
export class DashboardMetricsCacheService {
  private cache = new Map<string, { data: any; expiresAt: number }>();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutos

  /**
   * Obtiene datos del caché si existen y no han expirado
   */
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached || Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return cached.data as T;
  }

  /**
   * Guarda datos en el caché con TTL
   */
  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.TTL_MS,
    });
  }

  /**
   * Genera clave de caché para métricas de período
   */
  generateKey(tenantId: number, period: string, startDate?: string, endDate?: string): string {
    if (period === 'custom' && startDate && endDate) {
      return `dashboard:${tenantId}:custom:${startDate}:${endDate}`;
    }
    return `dashboard:${tenantId}:${period}`;
  }

  /**
   * Limpia el caché de un tenant específico
   */
  invalidateTenant(tenantId: number): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`dashboard:${tenantId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Limpia entradas expiradas (llamar periódicamente)
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }
}

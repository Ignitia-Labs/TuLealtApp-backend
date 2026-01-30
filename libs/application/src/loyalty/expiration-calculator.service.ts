import { Injectable } from '@nestjs/common';
import { LoyaltyProgram, Tenant } from '@libs/domain';
import { LoyaltyProgramConfigResolver } from './loyalty-program-config-resolver.service';

/**
 * Servicio para calcular fechas de expiración de puntos
 * Basado en la política de expiración del programa y del tenant
 */
@Injectable()
export class ExpirationCalculator {
  constructor(private readonly configResolver: LoyaltyProgramConfigResolver) {}

  /**
   * Calcula la fecha de expiración para una transacción EARNING
   * @param program Programa de lealtad (puede ser null)
   * @param tenant Tenant con valores por defecto
   * @param earnedAt Fecha en que se ganaron los puntos (default: ahora)
   * @returns Fecha de expiración o null si nunca expira
   */
  calculateExpirationDate(
    program: LoyaltyProgram | null,
    tenant: Tenant,
    earnedAt: Date = new Date(),
  ): Date | null {
    // Verificar si la expiración está habilitada
    if (!this.configResolver.isExpirationEnabled(program, tenant)) {
      return null; // Nunca expira
    }

    // Obtener días hasta expiración
    const daysToExpire = this.configResolver.resolvePointsExpireDays(program, tenant);

    if (!daysToExpire || daysToExpire <= 0) {
      return null; // Nunca expira
    }

    // Calcular fecha de expiración
    const expirationDate = new Date(earnedAt);
    expirationDate.setDate(expirationDate.getDate() + daysToExpire);

    // Aplicar grace period si existe
    const gracePeriodDays = program?.expirationPolicy.gracePeriodDays || 0;
    if (gracePeriodDays > 0) {
      expirationDate.setDate(expirationDate.getDate() + gracePeriodDays);
    }

    return expirationDate;
  }

  /**
   * Verifica si una fecha de expiración ha pasado
   * @param expiresAt Fecha de expiración (puede ser null)
   * @param referenceDate Fecha de referencia (default: ahora)
   * @returns true si la fecha ha pasado
   */
  isExpired(expiresAt: Date | null, referenceDate: Date = new Date()): boolean {
    if (!expiresAt) {
      return false; // Nunca expira
    }
    return referenceDate > expiresAt;
  }

  /**
   * Obtiene el tipo de política de expiración para un programa
   * @param program Programa de lealtad (puede ser null)
   * @returns Tipo de política ('simple' | 'bucketed')
   */
  getExpirationPolicyType(program: LoyaltyProgram | null): 'simple' | 'bucketed' {
    return this.configResolver.getExpirationPolicyType(program);
  }
}

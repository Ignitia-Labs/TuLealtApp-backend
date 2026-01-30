import { Injectable } from '@nestjs/common';
import { Tenant, LoyaltyProgram } from '@libs/domain';

/**
 * Servicio para resolver valores de configuración de programas de lealtad
 * Resuelve conflictos entre valores de Tenant (defaults) y LoyaltyProgram (específicos)
 *
 * Regla de precedencia:
 * 1. Si LoyaltyProgram tiene valor específico → usar ese valor
 * 2. Si LoyaltyProgram no tiene valor → usar valor de Tenant como fallback
 *
 * Esto permite que:
 * - Tenant tenga valores por defecto para todos los programas base
 * - LoyaltyProgram pueda sobrescribir estos valores cuando sea necesario
 */
@Injectable()
export class LoyaltyProgramConfigResolver {
  /**
   * Resuelve el valor de minPointsToRedeem para un programa
   * Prioridad: LoyaltyProgram.minPointsToRedeem > Tenant.minPointsToRedeem
   *
   * @param program Programa de lealtad (puede ser null si no hay programa específico)
   * @param tenant Tenant que contiene valores por defecto
   * @returns Valor de minPointsToRedeem a usar
   */
  resolveMinPointsToRedeem(program: LoyaltyProgram | null, tenant: Tenant): number {
    // Si hay programa y tiene minPointsToRedeem > 0, usar ese valor
    if (program && program.minPointsToRedeem > 0) {
      return program.minPointsToRedeem;
    }

    // Si no hay programa o el programa tiene 0, usar valor del tenant
    return tenant.minPointsToRedeem;
  }

  /**
   * Resuelve el valor de pointsExpireDays para un programa
   * Prioridad: LoyaltyProgram.expirationPolicy.daysToExpire > Tenant.pointsExpireDays
   *
   * @param program Programa de lealtad (puede ser null si no hay programa específico)
   * @param tenant Tenant que contiene valores por defecto
   * @returns Valor de pointsExpireDays a usar (null si nunca expira)
   */
  resolvePointsExpireDays(program: LoyaltyProgram | null, tenant: Tenant): number | null {
    // Si hay programa y tiene expirationPolicy configurada
    if (program && program.expirationPolicy.enabled) {
      // Si el programa tiene daysToExpire específico, usar ese
      if (
        program.expirationPolicy.daysToExpire !== undefined &&
        program.expirationPolicy.daysToExpire !== null
      ) {
        return program.expirationPolicy.daysToExpire;
      }
      // Si expirationPolicy está enabled pero no tiene daysToExpire, usar valor del tenant
      return tenant.pointsExpireDays;
    }

    // Si no hay programa o expirationPolicy no está enabled, usar valor del tenant
    // Si tenant tiene 0 o null, interpretar como "nunca expira"
    return tenant.pointsExpireDays > 0 ? tenant.pointsExpireDays : null;
  }

  /**
   * Verifica si la expiración está habilitada para un programa
   * Prioridad: LoyaltyProgram.expirationPolicy.enabled > Tenant.pointsExpireDays > 0
   *
   * @param program Programa de lealtad (puede ser null si no hay programa específico)
   * @param tenant Tenant que contiene valores por defecto
   * @returns true si la expiración está habilitada
   */
  isExpirationEnabled(program: LoyaltyProgram | null, tenant: Tenant): boolean {
    // Si hay programa, usar su expirationPolicy.enabled
    if (program) {
      return program.expirationPolicy.enabled;
    }

    // Si no hay programa, verificar si tenant tiene pointsExpireDays > 0
    return tenant.pointsExpireDays > 0;
  }

  /**
   * Obtiene el tipo de política de expiración para un programa
   * Si el programa tiene expirationPolicy configurada, usar su tipo
   * Si no, usar 'simple' como default
   *
   * @param program Programa de lealtad (puede ser null si no hay programa específico)
   * @returns Tipo de política de expiración ('simple' | 'bucketed')
   */
  getExpirationPolicyType(program: LoyaltyProgram | null): 'simple' | 'bucketed' {
    if (program && program.expirationPolicy.enabled) {
      return program.expirationPolicy.type;
    }

    // Default a 'simple' si no hay programa o no está habilitado
    return 'simple';
  }
}

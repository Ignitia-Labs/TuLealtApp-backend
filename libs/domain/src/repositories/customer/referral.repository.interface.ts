import { Referral } from '@libs/domain/entities/customer/referral.entity';

/**
 * Interfaz del repositorio de Referral
 * Define el contrato que debe cumplir cualquier implementación
 * La implementación concreta estará en la capa de infraestructura
 */
export interface IReferralRepository {
  /**
   * Guarda un nuevo referral
   */
  save(referral: Referral): Promise<Referral>;

  /**
   * Busca un referral por su ID
   */
  findById(id: number): Promise<Referral | null>;

  /**
   * Busca referrals por referrer (quien refiere)
   */
  findByReferrer(referrerMembershipId: number, tenantId: number): Promise<Referral[]>;

  /**
   * Busca referrals por referido
   */
  findByReferred(referredMembershipId: number, tenantId: number): Promise<Referral[]>;

  /**
   * Busca un referral específico por referrer y referido
   */
  findByReferrerAndReferred(
    referrerMembershipId: number,
    referredMembershipId: number,
    tenantId: number,
  ): Promise<Referral | null>;

  /**
   * Busca referrals activos por referrer en un periodo
   * Útil para validar límites de referidos por mes
   */
  findActiveByReferrerInPeriod(
    referrerMembershipId: number,
    tenantId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Referral[]>;

  /**
   * Cuenta el número de referrals activos por referrer en un periodo
   */
  countActiveByReferrerInPeriod(
    referrerMembershipId: number,
    tenantId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<number>;

  /**
   * Busca referrals pendientes de primera compra
   * Útil para procesar cuando un referido hace su primera compra
   */
  findPendingByReferred(referredMembershipId: number, tenantId: number): Promise<Referral[]>;

  /**
   * Busca referrals que completaron primera compra pero aún no tienen recompensa otorgada
   */
  findCompletedWithoutReward(referrerMembershipId: number, tenantId: number): Promise<Referral[]>;
}

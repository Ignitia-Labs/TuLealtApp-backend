import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  IReferralRepository,
  Referral,
  ICustomerMembershipRepository,
  CustomerMembership,
} from '@libs/domain';

/**
 * Servicio para gestionar referidos
 * Implementa validaciones anti-fraude y lógica de negocio
 */
@Injectable()
export class ReferralService {
  constructor(
    @Inject('IReferralRepository')
    private readonly referralRepository: IReferralRepository,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
  ) {}

  /**
   * Crea un nuevo referral
   * Valida anti-fraude: no self-referral, límites por mes, cooldown
   */
  async createReferral(
    referrerMembershipId: number,
    referredMembershipId: number,
    tenantId: number,
    referralCode: string | null = null,
  ): Promise<Referral> {
    // Validación 1: No self-referral (ya validado en entidad, pero reforzamos aquí)
    if (referrerMembershipId === referredMembershipId) {
      throw new BadRequestException('Cannot create self-referral');
    }

    // Validación 2: Verificar que ambos memberships existan y pertenezcan al mismo tenant
    const referrerMembership = await this.membershipRepository.findById(referrerMembershipId);
    if (!referrerMembership) {
      throw new BadRequestException(`Referrer membership ${referrerMembershipId} not found`);
    }
    if (referrerMembership.tenantId !== tenantId) {
      throw new BadRequestException(
        `Referrer membership ${referrerMembershipId} does not belong to tenant ${tenantId}`,
      );
    }

    const referredMembership = await this.membershipRepository.findById(referredMembershipId);
    if (!referredMembership) {
      throw new BadRequestException(`Referred membership ${referredMembershipId} not found`);
    }
    if (referredMembership.tenantId !== tenantId) {
      throw new BadRequestException(
        `Referred membership ${referredMembershipId} does not belong to tenant ${tenantId}`,
      );
    }

    // Validación 3: Verificar que no exista ya un referral activo entre estos dos
    const existingReferral = await this.referralRepository.findByReferrerAndReferred(
      referrerMembershipId,
      referredMembershipId,
      tenantId,
    );
    if (existingReferral && existingReferral.isActive()) {
      throw new BadRequestException(
        `Active referral already exists between memberships ${referrerMembershipId} and ${referredMembershipId}`,
      );
    }

    // Validación 4: Límite de referidos por mes (anti-fraude)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const referralsThisMonth = await this.referralRepository.countActiveByReferrerInPeriod(
      referrerMembershipId,
      tenantId,
      startOfMonth,
      endOfMonth,
    );

    // Límite por defecto: 50 referidos por mes (configurable por tenant en el futuro)
    const maxReferralsPerMonth = 50;
    if (referralsThisMonth >= maxReferralsPerMonth) {
      throw new BadRequestException(
        `Maximum referrals per month (${maxReferralsPerMonth}) reached for membership ${referrerMembershipId}`,
      );
    }

    // Validación 5: Cooldown - no crear referral si el referido ya tiene un referral reciente
    // (evitar que alguien se refiera a sí mismo con múltiples cuentas)
    const recentReferrals = await this.referralRepository.findByReferred(
      referredMembershipId,
      tenantId,
    );
    const cooldownHours = 24; // 24 horas de cooldown
    const cooldownDate = new Date(now.getTime() - cooldownHours * 60 * 60 * 1000);

    const hasRecentReferral = recentReferrals.some(
      (ref) => ref.createdAt >= cooldownDate && ref.isActive(),
    );
    if (hasRecentReferral) {
      throw new BadRequestException(
        `Referred membership ${referredMembershipId} has a recent referral. Cooldown: ${cooldownHours} hours`,
      );
    }

    // Crear el referral
    const referral = Referral.create(
      referrerMembershipId,
      referredMembershipId,
      tenantId,
      referralCode,
    );

    return await this.referralRepository.save(referral);
  }

  /**
   * Valida un referral antes de procesarlo
   */
  async validateReferral(referralId: number): Promise<Referral> {
    const referral = await this.referralRepository.findById(referralId);
    if (!referral) {
      throw new BadRequestException(`Referral ${referralId} not found`);
    }

    if (referral.isCancelled()) {
      throw new BadRequestException(`Referral ${referralId} is cancelled`);
    }

    return referral;
  }

  /**
   * Procesa la primera compra de un referido
   * Marca el referral como activo y listo para otorgar recompensa
   */
  async processFirstPurchase(referredMembershipId: number, tenantId: number): Promise<Referral[]> {
    // Buscar referrals pendientes para este referido
    const pendingReferrals = await this.referralRepository.findPendingByReferred(
      referredMembershipId,
      tenantId,
    );

    if (pendingReferrals.length === 0) {
      return [];
    }

    // Marcar cada referral como completado
    const updatedReferrals: Referral[] = [];
    for (const referral of pendingReferrals) {
      const updated = referral.markFirstPurchaseCompleted();
      const saved = await this.referralRepository.save(updated);
      updatedReferrals.push(saved);
    }

    return updatedReferrals;
  }

  /**
   * Obtiene referrals que completaron primera compra pero aún no tienen recompensa otorgada
   * Útil para procesar recompensas pendientes
   */
  async getCompletedWithoutReward(
    referrerMembershipId: number,
    tenantId: number,
  ): Promise<Referral[]> {
    return await this.referralRepository.findCompletedWithoutReward(referrerMembershipId, tenantId);
  }

  /**
   * Marca la recompensa como otorgada
   */
  async markRewardGranted(referralId: number): Promise<Referral> {
    const referral = await this.referralRepository.findById(referralId);
    if (!referral) {
      throw new BadRequestException(`Referral ${referralId} not found`);
    }

    if (referral.hasRewardBeenGranted()) {
      return referral; // Ya estaba otorgada
    }

    if (!referral.hasFirstPurchaseCompleted()) {
      throw new BadRequestException(
        `Cannot grant reward for referral ${referralId}: first purchase not completed`,
      );
    }

    const updated = referral.markRewardGranted();
    return await this.referralRepository.save(updated);
  }
}

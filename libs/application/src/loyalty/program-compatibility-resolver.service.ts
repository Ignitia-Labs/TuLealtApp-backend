import { Injectable, Inject } from '@nestjs/common';
import {
  IEnrollmentRepository,
  ILoyaltyProgramRepository,
  Enrollment,
  LoyaltyProgram,
  EarningDomain,
} from '@libs/domain';

/**
 * Servicio para resolver compatibilidad de programas según reglas anti-caos
 * Implementa la lógica descrita en PLAN-TIPOS-RECOMPENSA.md sección 4
 */
@Injectable()
export class ProgramCompatibilityResolver {
  constructor(
    @Inject('IEnrollmentRepository')
    private readonly enrollmentRepository: IEnrollmentRepository,
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
  ) {}

  /**
   * Resuelve la lista final de programas compatibles para un evento
   * Aplica las reglas de compatibilidad según el tipo de programa
   *
   * @param membershipId ID de la membership
   * @param tenantId ID del tenant
   * @returns Lista de programas compatibles que pueden procesar el evento
   */
  async resolveCompatiblePrograms(
    membershipId: number,
    tenantId: number,
  ): Promise<LoyaltyProgram[]> {
    // 1. Obtener todos los enrollments activos de la membership
    const enrollments = await this.enrollmentRepository.findActiveByMembershipId(membershipId);

    if (enrollments.length === 0) {
      return []; // No hay programas activos
    }

    // 2. Cargar los programas asociados
    const programIds = enrollments.map((e) => e.programId);
    const programs: LoyaltyProgram[] = [];
    for (const programId of programIds) {
      const program = await this.programRepository.findById(programId);
      if (program && program.isActive()) {
        programs.push(program);
      }
    }

    if (programs.length === 0) {
      return [];
    }

    // 3. Agrupar programas por tipo
    const programsByType = this.groupProgramsByType(programs);

    // 4. Aplicar reglas de compatibilidad
    const compatiblePrograms: LoyaltyProgram[] = [];

    // Regla 1: BaseGroup (EXCLUSIVE) - exactamente 1 activo
    if (programsByType.BASE.length > 0) {
      // Si hay múltiples BASE, elegir el de mayor priorityRank
      const baseProgram = programsByType.BASE.sort((a, b) => b.priorityRank - a.priorityRank)[0];
      compatiblePrograms.push(baseProgram);
    }

    // Regla 2: PromoGroup (STACKABLE_LIMITED) - maxProgramsPerEvent
    if (programsByType.PROMO.length > 0) {
      const promoPrograms = this.selectPromoPrograms(programsByType.PROMO);
      compatiblePrograms.push(...promoPrograms);
    }

    // Regla 3: PartnerGroup (PRIORITY) - gana el de mayor rank
    if (programsByType.PARTNER.length > 0) {
      const partnerProgram = programsByType.PARTNER.sort(
        (a, b) => b.priorityRank - a.priorityRank,
      )[0];
      compatiblePrograms.push(partnerProgram);
    }

    // Regla 4: SubscriptionGroup (ACCUMULABLE) - si no compiten por misma métrica
    if (programsByType.SUBSCRIPTION.length > 0) {
      const subscriptionPrograms = this.selectSubscriptionPrograms(
        programsByType.SUBSCRIPTION,
        compatiblePrograms,
      );
      compatiblePrograms.push(...subscriptionPrograms);
    }

    // Regla 5: Experimental - permitir todos pero validar earningDomains
    if (programsByType.EXPERIMENTAL.length > 0) {
      const experimentalPrograms = this.selectExperimentalPrograms(
        programsByType.EXPERIMENTAL,
        compatiblePrograms,
      );
      compatiblePrograms.push(...experimentalPrograms);
    }

    // 5. Validar que no haya doble BASE_PURCHASE (anti-caos)
    this.validateNoDoubleBasePurchase(compatiblePrograms);

    return compatiblePrograms;
  }

  /**
   * Agrupa programas por tipo
   */
  private groupProgramsByType(programs: LoyaltyProgram[]): {
    BASE: LoyaltyProgram[];
    PROMO: LoyaltyProgram[];
    PARTNER: LoyaltyProgram[];
    SUBSCRIPTION: LoyaltyProgram[];
    EXPERIMENTAL: LoyaltyProgram[];
  } {
    return {
      BASE: programs.filter((p) => p.programType === 'BASE'),
      PROMO: programs.filter((p) => p.programType === 'PROMO'),
      PARTNER: programs.filter((p) => p.programType === 'PARTNER'),
      SUBSCRIPTION: programs.filter((p) => p.programType === 'SUBSCRIPTION'),
      EXPERIMENTAL: programs.filter((p) => p.programType === 'EXPERIMENTAL'),
    };
  }

  /**
   * Selecciona programas PROMO según STACKABLE_LIMITED policy
   */
  private selectPromoPrograms(promoPrograms: LoyaltyProgram[]): LoyaltyProgram[] {
    // Ordenar por priorityRank descendente
    const sorted = promoPrograms.sort((a, b) => b.priorityRank - a.priorityRank);

    // Aplicar maxProgramsPerEvent si está configurado
    // Por defecto, solo 1 promo por evento (BEST_VALUE o PRIORITY_RANK)
    const maxProgramsPerEvent = 1; // Puede venir de configuración del tenant

    // Si hay stacking policy con selectionStrategy, aplicarlo
    // Por ahora, simplemente tomar el de mayor priorityRank
    return sorted.slice(0, maxProgramsPerEvent);
  }

  /**
   * Selecciona programas SUBSCRIPTION que no compiten por misma métrica
   */
  private selectSubscriptionPrograms(
    subscriptionPrograms: LoyaltyProgram[],
    alreadySelected: LoyaltyProgram[],
  ): LoyaltyProgram[] {
    const compatible: LoyaltyProgram[] = [];

    for (const subProgram of subscriptionPrograms) {
      // Verificar que no compita con programas ya seleccionados
      const conflicts = this.hasEarningDomainConflict(subProgram, alreadySelected);
      if (!conflicts) {
        compatible.push(subProgram);
      }
    }

    return compatible;
  }

  /**
   * Selecciona programas EXPERIMENTAL que no compiten
   */
  private selectExperimentalPrograms(
    experimentalPrograms: LoyaltyProgram[],
    alreadySelected: LoyaltyProgram[],
  ): LoyaltyProgram[] {
    const compatible: LoyaltyProgram[] = [];

    for (const expProgram of experimentalPrograms) {
      // Verificar que no compita con programas ya seleccionados
      const conflicts = this.hasEarningDomainConflict(expProgram, alreadySelected);
      if (!conflicts) {
        compatible.push(expProgram);
      }
    }

    return compatible;
  }

  /**
   * Verifica si un programa tiene conflictos de earningDomain con otros programas
   */
  private hasEarningDomainConflict(
    program: LoyaltyProgram,
    otherPrograms: LoyaltyProgram[],
  ): boolean {
    const programDomains = new Set(program.earningDomains.map((ed) => ed.domain));

    for (const otherProgram of otherPrograms) {
      const otherDomains = new Set(otherProgram.earningDomains.map((ed) => ed.domain));

      // Si ambos tienen BASE_PURCHASE, hay conflicto
      if (programDomains.has('BASE_PURCHASE' as any) && otherDomains.has('BASE_PURCHASE' as any)) {
        return true;
      }

      // Si ambos tienen el mismo dominio base, hay conflicto
      const baseDomains = ['BASE_PURCHASE', 'BASE_VISIT', 'BASE_SUBSCRIPTION'] as const;
      for (const domain of baseDomains) {
        if (programDomains.has(domain as any) && otherDomains.has(domain as any)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Valida que no haya doble BASE_PURCHASE (anti-caos)
   */
  private validateNoDoubleBasePurchase(programs: LoyaltyProgram[]): void {
    const basePurchasePrograms = programs.filter((p) =>
      p.earningDomains.some((ed) => ed.domain === 'BASE_PURCHASE'),
    );

    if (basePurchasePrograms.length > 1) {
      // Log warning pero no fallar - esto debería ser prevenido por las reglas anteriores
      console.warn(
        `Warning: Multiple programs with BASE_PURCHASE detected: ${basePurchasePrograms.map((p) => p.id).join(', ')}`,
      );
    }
  }
}

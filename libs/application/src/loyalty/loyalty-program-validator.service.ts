import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ILoyaltyProgramRepository, LoyaltyProgram, IEnrollmentRepository } from '@libs/domain';

/**
 * Servicio de validación para programas de lealtad
 * Implementa las reglas anti-caos descritas en PLAN-TIPOS-RECOMPENSA.md
 */
@Injectable()
export class LoyaltyProgramValidator {
  constructor(
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    @Inject('IEnrollmentRepository')
    private readonly enrollmentRepository: IEnrollmentRepository,
  ) {}

  /**
   * Valida que un programa pueda ser creado/actualizado según reglas anti-caos
   */
  async validateProgram(program: LoyaltyProgram): Promise<void> {
    // Validación 1: BASE programs deben tener BASE_PURCHASE en earningDomains
    if (program.programType === 'BASE') {
      const hasBasePurchase = program.hasEarningDomain('BASE_PURCHASE');
      if (!hasBasePurchase && program.earningDomains.length > 0) {
        throw new BadRequestException('BASE programs must include BASE_PURCHASE in earningDomains');
      }
    }

    // Validación 2: No puede haber más de un BASE activo por tenant
    if (program.programType === 'BASE' && program.isActive()) {
      const existingBase = await this.programRepository.findBaseProgramByTenantId(program.tenantId);
      if (existingBase && existingBase.id !== program.id) {
        throw new BadRequestException(
          `Cannot have multiple active BASE programs for tenant ${program.tenantId}. ` +
            `There is already an active BASE program with ID ${existingBase.id}`,
        );
      }
    }

    // Validación 3: No duplicar BASE_PURCHASE en múltiples programas activos
    if (program.hasEarningDomain('BASE_PURCHASE') && program.isActive()) {
      const programsWithBasePurchase = await this.programRepository.findByTenantIdAndEarningDomain(
        program.tenantId,
        'BASE_PURCHASE',
      );

      // Filtrar el programa actual si es una actualización
      const conflictingPrograms = programsWithBasePurchase.filter(
        (p) => p.id !== program.id && p.isActive(),
      );

      // Si hay conflictos y no son BASE programs, lanzar error
      const nonBaseConflicts = conflictingPrograms.filter((p) => p.programType !== 'BASE');

      if (nonBaseConflicts.length > 0 && program.programType !== 'BASE') {
        throw new BadRequestException(
          `Cannot have multiple active programs with BASE_PURCHASE domain. ` +
            `Conflicting programs: ${nonBaseConflicts.map((p) => p.id).join(', ')}`,
        );
      }
    }

    // Validación 4: priorityRank debe ser no negativo
    if (program.priorityRank < 0) {
      throw new BadRequestException('Priority rank must be non-negative');
    }

    // Validación 5: minPointsToRedeem debe ser no negativo
    if (program.minPointsToRedeem < 0) {
      throw new BadRequestException('minPointsToRedeem must be non-negative');
    }

    // Validación 6: activeFrom debe ser anterior a activeTo si ambos están definidos
    if (program.activeFrom && program.activeTo && program.activeFrom >= program.activeTo) {
      throw new BadRequestException('activeFrom must be before activeTo');
    }
  }

  /**
   * Valida que un tenant tenga exactamente un programa BASE activo
   * Esta validación se usa al activar programas BASE
   */
  async validateBaseProgramUniqueness(tenantId: number, excludeProgramId?: number): Promise<void> {
    const existingBase = await this.programRepository.findBaseProgramByTenantId(tenantId);

    if (existingBase && existingBase.id !== excludeProgramId) {
      throw new BadRequestException(
        `Tenant ${tenantId} already has an active BASE program with ID ${existingBase.id}. ` +
          'Only one BASE program can be active at a time.',
      );
    }
  }

  /**
   * Valida que un programa pueda ser eliminado
   * No se puede eliminar un programa si tiene enrollments activos
   */
  async validateProgramDeletion(programId: number): Promise<void> {
    const activeEnrollments = await this.enrollmentRepository.findActiveByProgramId(programId);

    if (activeEnrollments.length > 0) {
      throw new BadRequestException(
        `Cannot delete program ${programId} because it has ${activeEnrollments.length} active enrollments. ` +
          'Please end or pause all enrollments before deleting the program.',
      );
    }
  }

  /**
   * Valida compatibilidad entre dos programas
   * Verifica si pueden coexistir según sus políticas de stacking
   */
  validateProgramCompatibility(program1: LoyaltyProgram, program2: LoyaltyProgram): boolean {
    return program1.canCoexistWith(program2);
  }
}

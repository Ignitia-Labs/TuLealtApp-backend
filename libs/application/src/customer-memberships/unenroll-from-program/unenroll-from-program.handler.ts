import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  IEnrollmentRepository,
  ILoyaltyProgramRepository,
} from '@libs/domain';
import { UnenrollFromProgramRequest } from './unenroll-from-program.request';

/**
 * Handler para desinscribirse de un programa de lealtad
 * NO permite desinscribirse del programa BASE
 */
@Injectable()
export class UnenrollFromProgramHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('IEnrollmentRepository')
    private readonly enrollmentRepository: IEnrollmentRepository,
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
  ) {}

  async execute(request: UnenrollFromProgramRequest, userId: number): Promise<void> {
    // Validar membership y ownership
    const membership = await this.membershipRepository.findById(request.membershipId);
    if (!membership) {
      throw new NotFoundException(`Membership with ID ${request.membershipId} not found`);
    }

    if (membership.userId !== userId) {
      throw new NotFoundException(
        `Membership ${request.membershipId} does not belong to user ${userId}`,
      );
    }

    // Validar programa
    const program = await this.programRepository.findById(request.programId);
    if (!program) {
      throw new NotFoundException(`Program with ID ${request.programId} not found`);
    }

    // Validar que el programa pertenece al tenant de la membership
    if (program.tenantId !== membership.tenantId) {
      throw new BadRequestException(
        `Program ${request.programId} does not belong to tenant ${membership.tenantId}`,
      );
    }

    // ❌ NO permitir desinscribirse del BASE
    if (program.programType === 'BASE') {
      throw new BadRequestException(
        'Cannot unenroll from BASE program. BASE enrollment is permanent.',
      );
    }

    // Buscar enrollment
    const enrollment = await this.enrollmentRepository.findByMembershipIdAndProgramId(
      request.membershipId,
      request.programId,
    );

    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment not found for membership ${request.membershipId} and program ${request.programId}`,
      );
    }

    if (!enrollment.isActive()) {
      throw new BadRequestException(
        `Enrollment is not active (status: ${enrollment.status}). Cannot unenroll.`,
      );
    }

    // Marcar como ENDED
    const endedEnrollment = enrollment.end(new Date());
    await this.enrollmentRepository.save(endedEnrollment);
  }
}

import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  ILoyaltyProgramRepository,
  IEnrollmentRepository,
  ITenantRepository,
  Enrollment,
} from '@libs/domain';
import { EnrollInProgramRequest } from './enroll-in-program.request';
import { EnrollInProgramResponse } from './enroll-in-program.response';

/**
 * Handler para inscribir un customer en un programa de lealtad
 */
@Injectable()
export class EnrollInProgramHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    @Inject('IEnrollmentRepository')
    private readonly enrollmentRepository: IEnrollmentRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(request: EnrollInProgramRequest, userId: number): Promise<EnrollInProgramResponse> {
    // Obtener membership y validar ownership
    const membership = await this.membershipRepository.findById(request.membershipId);
    if (!membership) {
      throw new NotFoundException(`Membership with ID ${request.membershipId} not found`);
    }

    // Validar que la membership pertenece al usuario
    if (membership.userId !== userId) {
      throw new NotFoundException(
        `Membership ${request.membershipId} does not belong to user ${userId}`,
      );
    }

    // Validar que el programa existe y pertenece al tenant de la membership
    const program = await this.programRepository.findById(request.programId);
    if (!program) {
      throw new NotFoundException(`Loyalty program with ID ${request.programId} not found`);
    }

    if (program.tenantId !== membership.tenantId) {
      throw new BadRequestException(
        `Program ${request.programId} does not belong to tenant ${membership.tenantId}`,
      );
    }

    // Validar que el programa está activo
    if (!program.isActive()) {
      throw new BadRequestException(`Program ${request.programId} is not active`);
    }

    // Verificar si ya está enrollado
    const existingEnrollment = await this.enrollmentRepository.findByMembershipIdAndProgramId(
      request.membershipId,
      request.programId,
    );

    if (existingEnrollment && existingEnrollment.isActive()) {
      throw new BadRequestException(
        `Membership ${request.membershipId} is already enrolled in program ${request.programId}`,
      );
    }

    // Crear enrollment usando factory method
    const enrollment = Enrollment.create(
      request.membershipId,
      request.programId,
      new Date(), // effectiveFrom
      null, // effectiveTo
      null, // metadata
      'ACTIVE',
    );

    // Guardar enrollment
    const savedEnrollment = await this.enrollmentRepository.save(enrollment);

    return new EnrollInProgramResponse(savedEnrollment);
  }
}

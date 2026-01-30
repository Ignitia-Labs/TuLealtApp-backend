import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  IEnrollmentRepository,
  ILoyaltyProgramRepository,
  ITenantRepository,
  ICustomerMembershipRepository,
  Enrollment,
} from '@libs/domain';
import { CreateEnrollmentRequest } from './create-enrollment.request';
import { CreateEnrollmentResponse } from './create-enrollment.response';

/**
 * Handler para inscribir un customer en un programa de lealtad
 */
@Injectable()
export class CreateEnrollmentHandler {
  constructor(
    @Inject('IEnrollmentRepository')
    private readonly enrollmentRepository: IEnrollmentRepository,
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
  ) {}

  async execute(request: CreateEnrollmentRequest): Promise<CreateEnrollmentResponse> {
    // Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Validar que el programa existe y pertenece al tenant
    const program = await this.programRepository.findById(request.programId);
    if (!program) {
      throw new NotFoundException(`Loyalty program with ID ${request.programId} not found`);
    }
    if (program.tenantId !== request.tenantId) {
      throw new NotFoundException(
        `Loyalty program ${request.programId} does not belong to tenant ${request.tenantId}`,
      );
    }

    // Validar que la membership existe
    const membership = await this.membershipRepository.findById(request.membershipId);
    if (!membership) {
      throw new NotFoundException(`Customer membership with ID ${request.membershipId} not found`);
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
      request.effectiveFrom ? new Date(request.effectiveFrom) : new Date(),
      request.effectiveTo ? new Date(request.effectiveTo) : null,
      request.metadata || null,
      'ACTIVE',
    );

    // Guardar enrollment
    const savedEnrollment = await this.enrollmentRepository.save(enrollment);

    return new CreateEnrollmentResponse(savedEnrollment);
  }
}

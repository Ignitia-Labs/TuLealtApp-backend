import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IEnrollmentRepository, ILoyaltyProgramRepository, ITenantRepository } from '@libs/domain';
import { DeleteEnrollmentRequest } from './delete-enrollment.request';

/**
 * Handler para desinscribir un customer de un programa (marca como inactive)
 * Nota: Por ahora hace hard delete. Se puede cambiar a soft delete si es necesario.
 */
@Injectable()
export class DeleteEnrollmentHandler {
  constructor(
    @Inject('IEnrollmentRepository')
    private readonly enrollmentRepository: IEnrollmentRepository,
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(request: DeleteEnrollmentRequest): Promise<void> {
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

    // Obtener enrollment
    const enrollment = await this.enrollmentRepository.findById(request.enrollmentId);
    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${request.enrollmentId} not found`);
    }

    // Validar que el enrollment pertenece al programa
    if (enrollment.programId !== request.programId) {
      throw new NotFoundException(
        `Enrollment ${request.enrollmentId} does not belong to program ${request.programId}`,
      );
    }

    // Eliminar enrollment (hard delete)
    await this.enrollmentRepository.delete(request.enrollmentId);
  }
}

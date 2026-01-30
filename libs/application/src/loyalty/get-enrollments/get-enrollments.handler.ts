import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IEnrollmentRepository, ILoyaltyProgramRepository, ITenantRepository } from '@libs/domain';
import { GetEnrollmentsRequest } from './get-enrollments.request';
import { GetEnrollmentsResponse } from './get-enrollments.response';

/**
 * Handler para obtener enrollments de un programa
 * Nota: Por ahora retorna todos los enrollments sin paginación real en BD
 * Se puede mejorar agregando paginación en el repositorio
 */
@Injectable()
export class GetEnrollmentsHandler {
  constructor(
    @Inject('IEnrollmentRepository')
    private readonly enrollmentRepository: IEnrollmentRepository,
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(request: GetEnrollmentsRequest): Promise<GetEnrollmentsResponse> {
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

    // Obtener enrollments según filtros
    let enrollments;
    if (request.status === 'active') {
      enrollments = await this.enrollmentRepository.findActiveByProgramId(request.programId);
    } else {
      // Para 'inactive' o 'all', necesitaríamos un método adicional en el repositorio
      // Por ahora, obtenemos todos los activos y filtramos manualmente
      enrollments = await this.enrollmentRepository.findActiveByProgramId(request.programId);
      if (request.status === 'inactive') {
        enrollments = enrollments.filter((e) => !e.isActive());
      }
    }

    // Paginación manual (se puede mejorar con paginación en BD)
    const page = request.page || 1;
    const limit = request.limit || 20;
    const total = enrollments.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEnrollments = enrollments.slice(startIndex, endIndex);

    return new GetEnrollmentsResponse(paginatedEnrollments, total, page, limit);
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  ILoyaltyProgramRepository,
  IEnrollmentRepository,
  IPointsTransactionRepository,
  ITenantRepository,
} from '@libs/domain';
import { GetCustomerLoyaltyProgramsRequest } from './get-loyalty-programs.request';
import { GetCustomerLoyaltyProgramsResponse } from './get-loyalty-programs.response';

/**
 * Handler para obtener programas de lealtad disponibles para una membership
 */
@Injectable()
export class GetCustomerLoyaltyProgramsHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    @Inject('IEnrollmentRepository')
    private readonly enrollmentRepository: IEnrollmentRepository,
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(
    request: GetCustomerLoyaltyProgramsRequest,
    userId: number,
  ): Promise<GetCustomerLoyaltyProgramsResponse> {
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

    // Obtener todos los programas del tenant
    let programs;
    if (request.status === 'active') {
      programs = await this.programRepository.findActiveByTenantId(membership.tenantId);
    } else {
      programs = await this.programRepository.findByTenantId(membership.tenantId);
    }

    // Filtrar por status si es necesario
    if (request.status === 'active') {
      programs = programs.filter((p) => p.isActive());
    } else if (request.status === 'inactive') {
      programs = programs.filter((p) => !p.isActive());
    }

    // Obtener enrollments de la membership
    const enrollments = await this.enrollmentRepository.findByMembershipId(request.membershipId);

    // Filtrar por enrolled si es necesario
    if (request.enrolled === 'true') {
      programs = programs.filter((p) =>
        enrollments.some((e) => e.programId === p.id && e.isActive()),
      );
    } else if (request.enrolled === 'false') {
      programs = programs.filter(
        (p) => !enrollments.some((e) => e.programId === p.id && e.isActive()),
      );
    }

    // Calcular puntos ganados por programa
    const pointsByProgram = new Map<number, number>();
    const allTransactions = await this.pointsTransactionRepository.findByMembershipId(
      request.membershipId,
    );

    // Agrupar puntos por programId (si está en metadata)
    for (const tx of allTransactions) {
      if (tx.type === 'EARNING' && tx.pointsDelta > 0 && tx.metadata) {
        const programId = tx.metadata.programId;
        if (programId) {
          const current = pointsByProgram.get(programId) || 0;
          pointsByProgram.set(programId, current + tx.pointsDelta);
        }
      }
    }

    return new GetCustomerLoyaltyProgramsResponse(programs, enrollments, pointsByProgram);
  }
}

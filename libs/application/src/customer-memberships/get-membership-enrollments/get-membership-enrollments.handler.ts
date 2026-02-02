import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  IEnrollmentRepository,
  ILoyaltyProgramRepository,
  IPointsTransactionRepository,
} from '@libs/domain';
import { GetMembershipEnrollmentsRequest } from './get-membership-enrollments.request';
import { GetMembershipEnrollmentsResponse, EnrollmentDetailDto } from './get-membership-enrollments.response';

/**
 * Handler para obtener enrollments de una membership
 */
@Injectable()
export class GetMembershipEnrollmentsHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('IEnrollmentRepository')
    private readonly enrollmentRepository: IEnrollmentRepository,
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
  ) {}

  async execute(
    request: GetMembershipEnrollmentsRequest,
    userId: number,
  ): Promise<GetMembershipEnrollmentsResponse> {
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

    // Obtener enrollments de la membership
    const enrollments = await this.enrollmentRepository.findByMembershipId(request.membershipId);

    // Obtener todas las transacciones para calcular puntos por programa
    const allTransactions = await this.pointsTransactionRepository.findByMembershipId(
      request.membershipId,
    );

    // Calcular puntos ganados por programa
    const pointsByProgram = new Map<number, number>();
    for (const tx of allTransactions) {
      if (tx.type === 'EARNING' && tx.pointsDelta > 0 && tx.metadata) {
        const programId = tx.metadata.programId;
        if (programId) {
          const current = pointsByProgram.get(programId) || 0;
          pointsByProgram.set(programId, current + tx.pointsDelta);
        }
      }
    }

    // Construir DTOs con información del programa
    const enrollmentDtos: EnrollmentDetailDto[] = await Promise.all(
      enrollments.map(async (enrollment) => {
        const program = await this.programRepository.findById(enrollment.programId);
        const pointsEarned = pointsByProgram.get(enrollment.programId) || 0;

        return {
          id: enrollment.id,
          programId: enrollment.programId,
          programName: program?.name || 'Unknown Program',
          programType: program?.programType || 'UNKNOWN',
          status: enrollment.status,
          effectiveFrom: enrollment.effectiveFrom,
          effectiveTo: enrollment.effectiveTo,
          enrolledAt: enrollment.createdAt,
          pointsEarned,
        };
      }),
    );

    return new GetMembershipEnrollmentsResponse(enrollmentDtos);
  }
}

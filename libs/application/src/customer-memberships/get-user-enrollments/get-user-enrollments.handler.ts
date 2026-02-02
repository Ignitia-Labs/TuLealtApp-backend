import { Injectable, Inject } from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  IEnrollmentRepository,
  ILoyaltyProgramRepository,
  IPointsTransactionRepository,
  ITenantRepository,
} from '@libs/domain';
import { GetUserEnrollmentsRequest } from './get-user-enrollments.request';
import { GetUserEnrollmentsResponse, UserEnrollmentDto } from './get-user-enrollments.response';

/**
 * Handler para obtener todos los enrollments del usuario autenticado
 * Retorna enrollments de todas las memberships del usuario
 */
@Injectable()
export class GetUserEnrollmentsHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('IEnrollmentRepository')
    private readonly enrollmentRepository: IEnrollmentRepository,
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(
    request: GetUserEnrollmentsRequest,
    userId: number,
  ): Promise<GetUserEnrollmentsResponse> {
    // Obtener todas las memberships del usuario
    const memberships = await this.membershipRepository.findByUserId(userId);

    if (memberships.length === 0) {
      return new GetUserEnrollmentsResponse([]);
    }

    // Obtener todos los enrollments de todas las memberships
    const allEnrollments = await Promise.all(
      memberships.map((membership) =>
        this.enrollmentRepository.findByMembershipId(membership.id),
      ),
    );

    // Aplanar array de arrays
    const enrollments = allEnrollments.flat();

    // Filtrar por status si es necesario
    let filteredEnrollments = enrollments;
    if (request.status && request.status !== 'all') {
      filteredEnrollments = enrollments.filter((e) => e.status === request.status);
    }

    // Obtener información de programas y tenants para cada enrollment
    const enrollmentDtos: UserEnrollmentDto[] = await Promise.all(
      filteredEnrollments.map(async (enrollment) => {
        // Obtener membership
        const membership = memberships.find((m) => m.id === enrollment.membershipId);
        if (!membership) {
          throw new Error(`Membership ${enrollment.membershipId} not found`);
        }

        // Obtener tenant
        const tenant = await this.tenantRepository.findById(membership.tenantId);
        if (!tenant) {
          throw new Error(`Tenant ${membership.tenantId} not found`);
        }

        // Obtener programa
        const program = await this.programRepository.findById(enrollment.programId);

        // Calcular puntos ganados en este programa para esta membership
        const transactions = await this.pointsTransactionRepository.findByMembershipId(
          membership.id,
        );
        const pointsEarned = transactions
          .filter(
            (tx) =>
              tx.type === 'EARNING' &&
              tx.pointsDelta > 0 &&
              tx.metadata?.programId === enrollment.programId,
          )
          .reduce((sum, tx) => sum + tx.pointsDelta, 0);

        return {
          id: enrollment.id,
          membershipId: membership.id,
          membershipTenantName: tenant.name,
          membershipTenantId: tenant.id,
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

    return new GetUserEnrollmentsResponse(enrollmentDtos);
  }
}

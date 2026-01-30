import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ILoyaltyProgramRepository,
  IRewardRuleRepository,
  IEnrollmentRepository,
  ITenantRepository,
} from '@libs/domain';
import { GetLoyaltyProgramRequest } from './get-loyalty-program.request';
import { GetLoyaltyProgramResponse } from './get-loyalty-program.response';

/**
 * Handler para obtener un programa de lealtad por ID con detalles completos
 */
@Injectable()
export class GetLoyaltyProgramHandler {
  constructor(
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    @Inject('IRewardRuleRepository')
    private readonly ruleRepository: IRewardRuleRepository,
    @Inject('IEnrollmentRepository')
    private readonly enrollmentRepository: IEnrollmentRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(request: GetLoyaltyProgramRequest): Promise<GetLoyaltyProgramResponse> {
    // Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Obtener programa
    const program = await this.programRepository.findById(request.programId);
    if (!program) {
      throw new NotFoundException(`Loyalty program with ID ${request.programId} not found`);
    }

    // Validar que el programa pertenece al tenant
    if (program.tenantId !== request.tenantId) {
      throw new NotFoundException(
        `Loyalty program ${request.programId} does not belong to tenant ${request.tenantId}`,
      );
    }

    // Obtener reglas del programa
    const rules = await this.ruleRepository.findByProgramId(request.programId);

    // Contar enrollments activos
    const enrollments = await this.enrollmentRepository.findActiveByProgramId(request.programId);
    const enrollmentsCount = enrollments.length;

    return new GetLoyaltyProgramResponse(program, rules, enrollmentsCount);
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IRewardRuleRepository, ILoyaltyProgramRepository, ITenantRepository } from '@libs/domain';
import { GetRewardRuleRequest } from './get-reward-rule.request';
import { GetRewardRuleResponse } from './get-reward-rule.response';

/**
 * Handler para obtener una regla de recompensa por ID
 */
@Injectable()
export class GetRewardRuleHandler {
  constructor(
    @Inject('IRewardRuleRepository')
    private readonly ruleRepository: IRewardRuleRepository,
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(request: GetRewardRuleRequest): Promise<GetRewardRuleResponse> {
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

    // Obtener regla
    const rule = await this.ruleRepository.findById(request.ruleId);
    if (!rule) {
      throw new NotFoundException(`Reward rule with ID ${request.ruleId} not found`);
    }

    // Validar que la regla pertenece al programa
    if (rule.programId !== request.programId) {
      throw new NotFoundException(
        `Reward rule ${request.ruleId} does not belong to program ${request.programId}`,
      );
    }

    return new GetRewardRuleResponse(rule);
  }
}

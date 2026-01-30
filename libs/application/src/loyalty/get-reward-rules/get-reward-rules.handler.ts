import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IRewardRuleRepository, ILoyaltyProgramRepository, ITenantRepository } from '@libs/domain';
import { GetRewardRulesRequest } from './get-reward-rules.request';
import { GetRewardRulesResponse } from './get-reward-rules.response';

/**
 * Handler para obtener reglas de recompensa de un programa
 */
@Injectable()
export class GetRewardRulesHandler {
  constructor(
    @Inject('IRewardRuleRepository')
    private readonly ruleRepository: IRewardRuleRepository,
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(request: GetRewardRulesRequest): Promise<GetRewardRulesResponse> {
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

    // Obtener reglas según filtros
    let rules;
    if (request.trigger && request.trigger !== 'all') {
      rules = await this.ruleRepository.findByProgramIdAndTrigger(
        request.programId,
        request.trigger,
      );
    } else {
      rules = await this.ruleRepository.findByProgramId(request.programId);
    }

    // Filtrar por status si es necesario
    if (request.status === 'active') {
      rules = rules.filter((r) => r.status === 'active');
    } else if (request.status === 'inactive') {
      rules = rules.filter((r) => r.status === 'inactive');
    }

    return new GetRewardRulesResponse(rules);
  }
}

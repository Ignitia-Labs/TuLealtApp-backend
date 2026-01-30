import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  IRewardRuleRepository,
  ILoyaltyProgramRepository,
  ITenantRepository,
  RewardRule,
  isValidEarningDomain,
  PointsFormula,
  RewardRuleScope,
  ConflictSettings,
  IdempotencyScope,
} from '@libs/domain';
import { RewardRuleValidator } from '../reward-rule-validator.service';
import { CreateRewardRuleRequest } from './create-reward-rule.request';
import { CreateRewardRuleResponse } from './create-reward-rule.response';

/**
 * Handler para crear una nueva regla de recompensa
 */
@Injectable()
export class CreateRewardRuleHandler {
  constructor(
    @Inject('IRewardRuleRepository')
    private readonly ruleRepository: IRewardRuleRepository,
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    private readonly ruleValidator: RewardRuleValidator,
  ) {}

  async execute(request: CreateRewardRuleRequest): Promise<CreateRewardRuleResponse> {
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

    // Validar earning domain
    if (!isValidEarningDomain(request.earningDomain)) {
      throw new BadRequestException(
        `Invalid earning domain: ${request.earningDomain}. Must be from catalog.`,
      );
    }

    // Asegurar que scope tenga tenantId y programId
    const scope: RewardRuleScope = {
      ...request.scope,
      tenantId: request.tenantId,
      programId: request.programId,
    };

    // Crear regla usando factory method
    // Los DTOs son estructuralmente compatibles con los tipos del dominio
    const rule = RewardRule.create(
      request.programId,
      request.name,
      request.trigger,
      scope,
      request.eligibility || {},
      request.pointsFormula as PointsFormula,
      request.limits || {},
      request.conflict as ConflictSettings,
      request.idempotencyScope as IdempotencyScope,
      request.earningDomain,
      request.description || null,
      request.status || 'draft',
      1, // version
      request.activeFrom ? new Date(request.activeFrom) : null,
      request.activeTo ? new Date(request.activeTo) : null,
    );

    // Validar regla según reglas anti-caos
    await this.ruleValidator.validateRule(rule);

    // Guardar regla
    const savedRule = await this.ruleRepository.save(rule);

    return new CreateRewardRuleResponse(savedRule);
  }
}

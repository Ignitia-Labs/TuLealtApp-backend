import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IRewardRuleRepository,
  ILoyaltyProgramRepository,
  ITenantRepository,
  PointsFormula,
  ConflictSettings,
  IdempotencyScope,
} from '@libs/domain';
import { RewardRuleValidator } from '../reward-rule-validator.service';
import { UpdateRewardRuleRequest } from './update-reward-rule.request';
import { UpdateRewardRuleResponse } from './update-reward-rule.response';

/**
 * Handler para actualizar una regla de recompensa existente
 * Nota: RewardRule es inmutable, así que creamos una nueva versión
 */
@Injectable()
export class UpdateRewardRuleHandler {
  constructor(
    @Inject('IRewardRuleRepository')
    private readonly ruleRepository: IRewardRuleRepository,
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    private readonly ruleValidator: RewardRuleValidator,
  ) {}

  async execute(request: UpdateRewardRuleRequest): Promise<UpdateRewardRuleResponse> {
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

    // Obtener regla existente
    const existingRule = await this.ruleRepository.findById(request.ruleId);
    if (!existingRule) {
      throw new NotFoundException(`Reward rule with ID ${request.ruleId} not found`);
    }

    // Validar que la regla pertenece al programa
    if (existingRule.programId !== request.programId) {
      throw new NotFoundException(
        `Reward rule ${request.ruleId} does not belong to program ${request.programId}`,
      );
    }

    // Crear nueva versión con actualizaciones
    // Los DTOs son estructuralmente compatibles con los tipos del dominio
    const updatedRule = existingRule.createNewVersion({
      name: request.name,
      description: request.description,
      eligibility: request.eligibility,
      pointsFormula: request.pointsFormula as PointsFormula | undefined,
      limits: request.limits,
      conflict: request.conflict as ConflictSettings | undefined,
      idempotencyScope: request.idempotencyScope as IdempotencyScope | undefined,
    });

    // Actualizar status si se proporciona
    let finalRule = updatedRule;
    if (request.status !== undefined) {
      if (request.status === 'active') {
        finalRule = updatedRule.activate(request.activeFrom || undefined);
      } else if (request.status === 'inactive') {
        finalRule = updatedRule.deactivate();
      } else {
        // draft - crear nueva instancia con status draft
        finalRule = new (updatedRule.constructor as any)(
          updatedRule.id,
          updatedRule.programId,
          updatedRule.name,
          updatedRule.description,
          updatedRule.trigger,
          updatedRule.scope,
          updatedRule.eligibility,
          updatedRule.pointsFormula,
          updatedRule.limits,
          updatedRule.conflict,
          updatedRule.idempotencyScope,
          updatedRule.earningDomain,
          'draft',
          updatedRule.version,
          request.activeFrom ? new Date(request.activeFrom) : updatedRule.activeFrom,
          request.activeTo ? new Date(request.activeTo) : updatedRule.activeTo,
          updatedRule.createdAt,
          new Date(),
        );
      }
    } else {
      // Actualizar activeFrom/activeTo si se proporcionan sin cambiar status
      if (request.activeFrom !== undefined || request.activeTo !== undefined) {
        finalRule = new (updatedRule.constructor as any)(
          updatedRule.id,
          updatedRule.programId,
          updatedRule.name,
          updatedRule.description,
          updatedRule.trigger,
          updatedRule.scope,
          updatedRule.eligibility,
          updatedRule.pointsFormula,
          updatedRule.limits,
          updatedRule.conflict,
          updatedRule.idempotencyScope,
          updatedRule.earningDomain,
          updatedRule.status,
          updatedRule.version,
          request.activeFrom ? new Date(request.activeFrom) : updatedRule.activeFrom,
          request.activeTo ? new Date(request.activeTo) : updatedRule.activeTo,
          updatedRule.createdAt,
          new Date(),
        );
      }
    }

    // Validar regla actualizada
    await this.ruleValidator.validateRule(finalRule);

    // Guardar regla actualizada
    const savedRule = await this.ruleRepository.save(finalRule);

    return new UpdateRewardRuleResponse(savedRule);
  }
}

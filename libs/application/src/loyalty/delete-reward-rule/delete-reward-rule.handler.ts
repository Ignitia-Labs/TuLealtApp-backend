import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IRewardRuleRepository, ILoyaltyProgramRepository, ITenantRepository } from '@libs/domain';
import { DeleteRewardRuleRequest } from './delete-reward-rule.request';

/**
 * Handler para eliminar una regla de recompensa
 * Nota: Por ahora hace hard delete. Se puede cambiar a soft delete si es necesario.
 */
@Injectable()
export class DeleteRewardRuleHandler {
  constructor(
    @Inject('IRewardRuleRepository')
    private readonly ruleRepository: IRewardRuleRepository,
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(request: DeleteRewardRuleRequest): Promise<void> {
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

    // Validar que no esté activa (opcional - se puede permitir eliminar activas)
    if (rule.isActive()) {
      throw new BadRequestException('Cannot delete an active reward rule. Deactivate it first.');
    }

    // Eliminar regla
    await this.ruleRepository.delete(request.ruleId);
  }
}

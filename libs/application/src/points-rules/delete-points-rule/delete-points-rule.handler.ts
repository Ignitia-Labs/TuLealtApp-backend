import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPointsRuleRepository } from '@libs/domain';
import { DeletePointsRuleRequest } from './delete-points-rule.request';
import { DeletePointsRuleResponse } from './delete-points-rule.response';

/**
 * Handler para el caso de uso de eliminar una regla de puntos
 */
@Injectable()
export class DeletePointsRuleHandler {
  constructor(
    @Inject('IPointsRuleRepository')
    private readonly pointsRuleRepository: IPointsRuleRepository,
  ) {}

  async execute(request: DeletePointsRuleRequest): Promise<DeletePointsRuleResponse> {
    // Verificar que la regla existe
    const rule = await this.pointsRuleRepository.findById(request.pointsRuleId);

    if (!rule) {
      throw new NotFoundException(`Points rule with ID ${request.pointsRuleId} not found`);
    }

    // Eliminar la regla
    await this.pointsRuleRepository.delete(request.pointsRuleId);

    return new DeletePointsRuleResponse('Points rule deleted successfully', request.pointsRuleId);
  }
}


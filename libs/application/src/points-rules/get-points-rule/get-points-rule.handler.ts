import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPointsRuleRepository } from '@libs/domain';
import { GetPointsRuleRequest } from './get-points-rule.request';
import { GetPointsRuleResponse } from './get-points-rule.response';
import { PointsRuleDto } from '../dto/points-rule.dto';

/**
 * Handler para el caso de uso de obtener una regla de puntos por ID
 */
@Injectable()
export class GetPointsRuleHandler {
  constructor(
    @Inject('IPointsRuleRepository')
    private readonly pointsRuleRepository: IPointsRuleRepository,
  ) {}

  async execute(request: GetPointsRuleRequest): Promise<GetPointsRuleResponse> {
    const rule = await this.pointsRuleRepository.findById(request.pointsRuleId);

    if (!rule) {
      throw new NotFoundException(`Points rule with ID ${request.pointsRuleId} not found`);
    }

    const ruleDto = new PointsRuleDto(
      rule.id,
      rule.tenantId,
      rule.name,
      rule.description,
      rule.type,
      rule.pointsPerUnit,
      rule.minAmount,
      rule.multiplier,
      rule.applicableDays,
      rule.applicableHours,
      rule.validFrom,
      rule.validUntil,
      rule.status,
      rule.priority,
      rule.createdAt,
      rule.updatedAt,
    );

    return new GetPointsRuleResponse(ruleDto);
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ITenantRepository, IPointsRuleRepository } from '@libs/domain';
import { GetPointsRulesRequest } from './get-points-rules.request';
import { GetPointsRulesResponse } from './get-points-rules.response';
import { PointsRuleDto } from '../dto/points-rule.dto';

/**
 * Handler para el caso de uso de obtener reglas de puntos por tenant
 */
@Injectable()
export class GetPointsRulesHandler {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IPointsRuleRepository')
    private readonly pointsRuleRepository: IPointsRuleRepository,
  ) {}

  async execute(request: GetPointsRulesRequest): Promise<GetPointsRulesResponse> {
    // Verificar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Obtener todas las reglas del tenant
    const rules = await this.pointsRuleRepository.findByTenantId(request.tenantId);

    // Ordenar por prioridad (mayor primero) y luego por fecha de creación
    const sortedRules = rules.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Convertir a DTOs de respuesta
    const ruleDtos = sortedRules.map(
      (rule) =>
        new PointsRuleDto(
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
        ),
    );

    return new GetPointsRulesResponse(ruleDtos);
  }
}

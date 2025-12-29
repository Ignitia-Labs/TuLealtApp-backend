import { ApiProperty } from '@nestjs/swagger';
import { PointsRuleDto } from '../dto/points-rule.dto';

/**
 * DTO de response para obtener una regla de puntos
 */
export class GetPointsRuleResponse {
  @ApiProperty({
    description: 'Regla de puntos encontrada',
    type: PointsRuleDto,
    example: {
      id: 1,
      tenantId: 1,
      name: 'Puntos por compra',
      description: 'Gana 1 punto por cada Q10.00 de compra',
      type: 'purchase',
      pointsPerUnit: 0.1,
      minAmount: 50.0,
      multiplier: null,
      applicableDays: [1, 2, 3, 4, 5],
      applicableHours: { start: '09:00', end: '18:00' },
      validFrom: '2024-01-01T00:00:00.000Z',
      validUntil: '2024-12-31T23:59:59.999Z',
      status: 'active',
      priority: 1,
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z',
    },
  })
  rule: PointsRuleDto;

  constructor(rule: PointsRuleDto) {
    this.rule = rule;
  }
}


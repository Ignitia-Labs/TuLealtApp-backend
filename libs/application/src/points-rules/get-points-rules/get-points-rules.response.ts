import { ApiProperty } from '@nestjs/swagger';
import { PointsRuleDto } from '../dto/points-rule.dto';

/**
 * DTO de response para obtener reglas de puntos por tenant
 */
export class GetPointsRulesResponse {
  @ApiProperty({
    description: 'Lista de reglas de puntos del tenant',
    type: PointsRuleDto,
    isArray: true,
    example: [
      {
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
      {
        id: 2,
        tenantId: 1,
        name: 'Puntos por visita',
        description: 'Gana 10 puntos por cada visita',
        type: 'visit',
        pointsPerUnit: 10,
        minAmount: null,
        multiplier: null,
        applicableDays: null,
        applicableHours: null,
        validFrom: null,
        validUntil: null,
        status: 'active',
        priority: 2,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    ],
  })
  rules: PointsRuleDto[];

  @ApiProperty({
    description: 'Total de reglas encontradas',
    example: 2,
    type: Number,
  })
  total: number;

  constructor(rules: PointsRuleDto[]) {
    this.rules = rules;
    this.total = rules.length;
  }
}

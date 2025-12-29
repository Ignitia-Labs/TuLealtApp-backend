import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para eliminar una regla de puntos
 */
export class DeletePointsRuleRequest {
  @ApiProperty({
    description: 'ID de la regla de puntos a eliminar',
    example: 1,
    type: Number,
  })
  pointsRuleId: number;
}


import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min } from 'class-validator';

/**
 * DTO de request para obtener una regla de puntos por ID
 */
export class GetPointsRuleRequest {
  @ApiProperty({
    description: 'ID único de la regla de puntos',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  pointsRuleId: number;
}


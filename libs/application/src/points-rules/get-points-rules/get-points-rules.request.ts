import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min } from 'class-validator';

/**
 * DTO de request para obtener reglas de puntos por tenant
 */
export class GetPointsRulesRequest {
  @ApiProperty({
    description: 'ID del tenant para filtrar las reglas de puntos',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  tenantId: number;
}


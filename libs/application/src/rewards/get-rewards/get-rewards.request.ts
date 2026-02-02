import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener recompensas de un tenant
 */
export class GetRewardsRequest {
  @ApiProperty({
    description: 'ID del tenant',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  tenantId: number;
}

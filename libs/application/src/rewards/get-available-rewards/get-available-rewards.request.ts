import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener recompensas disponibles
 */
export class GetAvailableRewardsRequest {
  @ApiProperty({
    description: 'ID de la membership del cliente',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  membershipId: number;
}

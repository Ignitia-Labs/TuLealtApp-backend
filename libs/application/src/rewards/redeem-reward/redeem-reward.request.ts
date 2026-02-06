import { IsNotEmpty, IsNumber, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO de request para canjear una recompensa
 */
export class RedeemRewardRequest {
  @ApiProperty({
    description: 'ID de la membership del cliente',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  membershipId: number;

  @ApiProperty({
    description: 'ID de la recompensa a canjear',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  rewardId: number;

  @ApiPropertyOptional({
    description: 'ID de la sucursal donde se canjea la recompensa (opcional)',
    example: 2,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number | null;
}

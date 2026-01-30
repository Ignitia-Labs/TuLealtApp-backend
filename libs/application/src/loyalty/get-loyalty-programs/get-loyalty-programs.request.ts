import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export type LoyaltyProgramStatusFilter = 'active' | 'inactive' | 'all';
export type LoyaltyProgramTypeFilter =
  | 'BASE'
  | 'PROMO'
  | 'PARTNER'
  | 'SUBSCRIPTION'
  | 'EXPERIMENTAL'
  | 'all';

export class GetLoyaltyProgramsRequest {
  @ApiProperty({ example: 1, description: 'ID del tenant' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tenantId: number;

  @ApiProperty({
    example: 'active',
    enum: ['active', 'inactive', 'all'],
    required: false,
    description: 'Filtrar por status',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'all'])
  status?: LoyaltyProgramStatusFilter;

  @ApiProperty({
    example: 'BASE',
    enum: ['BASE', 'PROMO', 'PARTNER', 'SUBSCRIPTION', 'EXPERIMENTAL', 'all'],
    required: false,
    description: 'Filtrar por tipo de programa',
  })
  @IsOptional()
  @IsEnum(['BASE', 'PROMO', 'PARTNER', 'SUBSCRIPTION', 'EXPERIMENTAL', 'all'])
  programType?: LoyaltyProgramTypeFilter;
}

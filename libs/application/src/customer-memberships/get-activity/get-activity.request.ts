import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export type ActivityTypeFilter = 'transactions' | 'tier_changes' | 'all';

export class GetActivityRequest {
  @ApiProperty({ example: 100, description: 'ID de la membership' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  membershipId: number;

  @ApiProperty({
    example: 10,
    required: false,
    description: 'Número de elementos a retornar',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({
    example: 'all',
    enum: ['transactions', 'tier_changes', 'all'],
    required: false,
    description: 'Tipo de actividad',
    default: 'all',
  })
  @IsOptional()
  @IsEnum(['transactions', 'tier_changes', 'all'])
  type?: ActivityTypeFilter;
}

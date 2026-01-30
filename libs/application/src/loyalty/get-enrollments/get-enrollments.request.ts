import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export type EnrollmentStatusFilter = 'active' | 'inactive' | 'all';

export class GetEnrollmentsRequest {
  @ApiProperty({ example: 1, description: 'ID del tenant' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tenantId: number;

  @ApiProperty({ example: 1, description: 'ID del programa de lealtad' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  programId: number;

  @ApiProperty({
    example: 'active',
    enum: ['active', 'inactive', 'all'],
    required: false,
    description: 'Filtrar por status',
    default: 'active',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'all'])
  status?: EnrollmentStatusFilter;

  @ApiProperty({ example: 1, required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ example: 20, required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

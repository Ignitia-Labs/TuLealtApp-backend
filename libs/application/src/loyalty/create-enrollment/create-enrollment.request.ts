import { IsInt, Min, IsOptional, IsDateString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateEnrollmentRequest {
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

  @ApiProperty({ example: 100, description: 'ID de la membership' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  membershipId: number;

  @ApiProperty({ example: '2025-01-29T10:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: Date | null;

  @ApiProperty({ example: null, required: false })
  @IsOptional()
  @IsDateString()
  effectiveTo?: Date | null;

  @ApiProperty({ example: {}, required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any> | null;
}

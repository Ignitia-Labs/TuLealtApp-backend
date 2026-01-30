import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsBoolean,
  IsDateString,
  ValidateNested,
  IsObject,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LoyaltyProgramStatus } from '@libs/domain';

class StackingPolicyDto {
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  allowed?: boolean;

  @ApiProperty({ example: 3, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxProgramsPerEvent?: number;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxProgramsPerPeriod?: number;

  @ApiProperty({ example: 'monthly', enum: ['daily', 'weekly', 'monthly'], required: false })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly'])
  period?: 'daily' | 'weekly' | 'monthly';

  @ApiProperty({
    example: 'BEST_VALUE',
    enum: ['BEST_VALUE', 'PRIORITY_RANK', 'FIRST_MATCH'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['BEST_VALUE', 'PRIORITY_RANK', 'FIRST_MATCH'])
  selectionStrategy?: 'BEST_VALUE' | 'PRIORITY_RANK' | 'FIRST_MATCH';
}

class ExpirationPolicyDto {
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty({ example: 'simple', enum: ['simple', 'bucketed'], required: false })
  @IsOptional()
  @IsEnum(['simple', 'bucketed'])
  type?: 'simple' | 'bucketed';

  @ApiProperty({ example: 365, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  daysToExpire?: number;

  @ApiProperty({ example: 7, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  gracePeriodDays?: number;
}

class ProgramLimitsDto {
  @ApiProperty({ example: 1000, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxPointsPerEvent?: number;

  @ApiProperty({ example: 5000, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxPointsPerDay?: number;

  @ApiProperty({ example: 50000, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxPointsPerMonth?: number;

  @ApiProperty({ example: 500000, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxPointsPerYear?: number;
}

export class UpdateLoyaltyProgramRequest {
  @ApiProperty({ example: 1, description: 'ID del tenant' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tenantId: number;

  @ApiProperty({ example: 1, description: 'ID del programa' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  programId: number;

  @ApiProperty({ example: 'Programa Promocional Verano Actualizado', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Descripción actualizada', required: false })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  priorityRank?: number;

  @ApiProperty({ type: StackingPolicyDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => StackingPolicyDto)
  stacking?: StackingPolicyDto;

  @ApiProperty({ type: ExpirationPolicyDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExpirationPolicyDto)
  expirationPolicy?: ExpirationPolicyDto;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  minPointsToRedeem?: number;

  @ApiProperty({ example: 'GTQ', required: false })
  @IsOptional()
  @IsString()
  currency?: string | null;

  @ApiProperty({ type: ProgramLimitsDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProgramLimitsDto)
  limits?: ProgramLimitsDto | null;

  @ApiProperty({ example: 'inactive', enum: ['active', 'inactive', 'draft'], required: false })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'draft'])
  status?: LoyaltyProgramStatus;

  @ApiProperty({ example: '2025-06-01T00:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  activeFrom?: Date | null;

  @ApiProperty({ example: '2025-09-30T23:59:59Z', required: false })
  @IsOptional()
  @IsDateString()
  activeTo?: Date | null;
}

import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
  IsDateString,
  ValidateNested,
  IsObject,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LoyaltyProgramType, LoyaltyProgramStatus } from '@libs/domain';
import { EarningDomain, isValidEarningDomain } from '@libs/domain';

class EarningDomainItemDto {
  @ApiProperty({ example: 'BASE_PURCHASE' })
  @IsString()
  @IsNotEmpty()
  domain: string;
}

class StackingPolicyDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  allowed: boolean;

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
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: 'simple', enum: ['simple', 'bucketed'] })
  @IsEnum(['simple', 'bucketed'])
  type: 'simple' | 'bucketed';

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

export class CreateLoyaltyProgramRequest {
  @ApiProperty({ example: 1, description: 'ID del tenant' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tenantId: number;

  @ApiProperty({ example: 'Programa Promocional Verano' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Descripción del programa', required: false })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({
    example: 'PROMO',
    enum: ['BASE', 'PROMO', 'PARTNER', 'SUBSCRIPTION', 'EXPERIMENTAL'],
  })
  @IsEnum(['BASE', 'PROMO', 'PARTNER', 'SUBSCRIPTION', 'EXPERIMENTAL'])
  programType: LoyaltyProgramType;

  @ApiProperty({ type: [EarningDomainItemDto], example: [{ domain: 'BASE_PURCHASE' }] })
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => EarningDomainItemDto)
  earningDomains: EarningDomainItemDto[];

  @ApiProperty({ example: 1, required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priorityRank?: number;

  @ApiProperty({ type: StackingPolicyDto })
  @ValidateNested()
  @Type(() => StackingPolicyDto)
  stacking: StackingPolicyDto;

  @ApiProperty({ type: ExpirationPolicyDto })
  @ValidateNested()
  @Type(() => ExpirationPolicyDto)
  expirationPolicy: ExpirationPolicyDto;

  @ApiProperty({ example: 100, required: false, default: 0 })
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

  @ApiProperty({
    example: 'active',
    enum: ['active', 'inactive', 'draft'],
    required: false,
    default: 'draft',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'draft'])
  status?: LoyaltyProgramStatus;

  @ApiProperty({ example: '2025-06-01T00:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  activeFrom?: Date | null;

  @ApiProperty({ example: '2025-08-31T23:59:59Z', required: false })
  @IsOptional()
  @IsDateString()
  activeTo?: Date | null;
}

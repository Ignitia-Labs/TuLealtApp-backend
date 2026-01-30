import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsObject,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  RewardRuleTrigger,
  RewardRuleStatus,
  EligibilityConditions,
  RewardRuleLimits,
  EarningDomain,
} from '@libs/domain';
import { RewardRuleScopeDto } from './dto/reward-rule-scope.dto';
import {
  PointsFormulaDto,
  PointsFormulaBaseDto,
  FixedPointsFormulaDto,
  RatePointsFormulaDto,
  TablePointsFormulaDto,
  HybridPointsFormulaDto,
} from './dto/points-formula.dto';
import { ConflictSettingsDto } from './dto/conflict-settings.dto';
import { IdempotencyScopeDto } from './dto/idempotency-scope.dto';

export class CreateRewardRuleRequest {
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

  @ApiProperty({ example: 'Recompensa por Visita Diaria' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Descripción de la regla', required: false })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({
    example: 'VISIT',
    enum: ['VISIT', 'PURCHASE', 'REFERRAL', 'SUBSCRIPTION', 'RETENTION', 'CUSTOM'],
  })
  @IsEnum(['VISIT', 'PURCHASE', 'REFERRAL', 'SUBSCRIPTION', 'RETENTION', 'CUSTOM'])
  trigger: RewardRuleTrigger;

  @ApiProperty({
    type: RewardRuleScopeDto,
    example: { tenantId: 1, programId: 1, storeId: null, branchId: null, channel: 'in-store' },
  })
  @ValidateNested()
  @Type(() => RewardRuleScopeDto)
  scope: RewardRuleScopeDto;

  @ApiProperty({ type: Object, example: { minTierId: null, maxTierId: null }, required: false })
  @IsOptional()
  @IsObject()
  eligibility?: EligibilityConditions;

  @ApiProperty({ type: Object, example: { type: 'fixed', points: 10 } })
  @ValidateNested()
  @Type(() => PointsFormulaBaseDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: FixedPointsFormulaDto, name: 'fixed' },
        { value: RatePointsFormulaDto, name: 'rate' },
        { value: TablePointsFormulaDto, name: 'table' },
        { value: HybridPointsFormulaDto, name: 'hybrid' },
      ],
    },
  })
  pointsFormula: PointsFormulaDto;

  @ApiProperty({
    type: Object,
    example: { frequency: 'daily', perPeriodCap: 100 },
    required: false,
  })
  @IsOptional()
  @IsObject()
  limits?: RewardRuleLimits;

  @ApiProperty({
    type: ConflictSettingsDto,
    example: { conflictGroup: 'CG_VISIT_DAILY', stackPolicy: 'EXCLUSIVE', priorityRank: 1 },
  })
  @ValidateNested()
  @Type(() => ConflictSettingsDto)
  conflict: ConflictSettingsDto;

  @ApiProperty({
    type: IdempotencyScopeDto,
    example: { strategy: 'per-day', bucketTimezone: 'America/Guatemala' },
  })
  @ValidateNested()
  @Type(() => IdempotencyScopeDto)
  idempotencyScope: IdempotencyScopeDto;

  @ApiProperty({ example: 'BASE_VISIT' })
  @IsString()
  @IsNotEmpty()
  earningDomain: EarningDomain;

  @ApiProperty({
    example: 'draft',
    enum: ['active', 'inactive', 'draft'],
    required: false,
    default: 'draft',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'draft'])
  status?: RewardRuleStatus;

  @ApiProperty({ example: '2025-01-01T00:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  activeFrom?: Date | null;

  @ApiProperty({ example: '2025-12-31T23:59:59Z', required: false })
  @IsOptional()
  @IsDateString()
  activeTo?: Date | null;
}

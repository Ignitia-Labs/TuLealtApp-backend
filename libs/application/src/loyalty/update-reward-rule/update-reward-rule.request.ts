import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsObject,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { RewardRuleStatus, EligibilityConditions, RewardRuleLimits } from '@libs/domain';
import { PointsFormulaDto } from '../create-reward-rule/dto/points-formula.dto';
import { ConflictSettingsDto } from '../create-reward-rule/dto/conflict-settings.dto';
import { IdempotencyScopeDto } from '../create-reward-rule/dto/idempotency-scope.dto';

export class UpdateRewardRuleRequest {
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

  @ApiProperty({ example: 1, description: 'ID de la regla' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ruleId: number;

  @ApiProperty({ example: 'Recompensa por Visita Diaria Actualizada', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Descripción actualizada', required: false })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ type: Object, required: false })
  @IsOptional()
  @IsObject()
  eligibility?: EligibilityConditions;

  @ApiProperty({ type: Object, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  pointsFormula?: PointsFormulaDto;

  @ApiProperty({ type: Object, required: false })
  @IsOptional()
  @IsObject()
  limits?: RewardRuleLimits;

  @ApiProperty({ type: ConflictSettingsDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConflictSettingsDto)
  conflict?: ConflictSettingsDto;

  @ApiProperty({ type: IdempotencyScopeDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => IdempotencyScopeDto)
  idempotencyScope?: IdempotencyScopeDto;

  @ApiProperty({ example: 'inactive', enum: ['active', 'inactive', 'draft'], required: false })
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

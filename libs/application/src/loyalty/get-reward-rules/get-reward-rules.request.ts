import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { RewardRuleTrigger, RewardRuleStatus } from '@libs/domain';

export type RewardRuleStatusFilter = 'active' | 'inactive' | 'all';
export type RewardRuleTriggerFilter = RewardRuleTrigger | 'all';

export class GetRewardRulesRequest {
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
    example: 'PURCHASE',
    enum: ['VISIT', 'PURCHASE', 'REFERRAL', 'SUBSCRIPTION', 'RETENTION', 'CUSTOM', 'all'],
    required: false,
    description: 'Filtrar por trigger',
  })
  @IsOptional()
  @IsEnum(['VISIT', 'PURCHASE', 'REFERRAL', 'SUBSCRIPTION', 'RETENTION', 'CUSTOM', 'all'])
  trigger?: RewardRuleTriggerFilter;

  @ApiProperty({
    example: 'active',
    enum: ['active', 'inactive', 'all'],
    required: false,
    description: 'Filtrar por status',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'all'])
  status?: RewardRuleStatusFilter;
}

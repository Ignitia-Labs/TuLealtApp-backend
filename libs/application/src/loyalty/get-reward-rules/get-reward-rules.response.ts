import { ApiProperty } from '@nestjs/swagger';
import { RewardRule } from '@libs/domain';

export class RewardRuleDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  programId: number;

  @ApiProperty({ example: 'Recompensa por Compra Base' })
  name: string;

  @ApiProperty({ example: 'Descripción de la regla', nullable: true })
  description: string | null;

  @ApiProperty({
    example: 'PURCHASE',
    enum: ['VISIT', 'PURCHASE', 'REFERRAL', 'SUBSCRIPTION', 'RETENTION', 'CUSTOM'],
  })
  trigger: string;

  @ApiProperty({ example: 'active', enum: ['active', 'inactive', 'draft'] })
  status: string;

  @ApiProperty({ example: { type: 'rate', rate: 0.1 } })
  pointsFormula: any;

  @ApiProperty({ example: { frequency: 'per-event', perPeriodCap: 1000 }, nullable: true })
  limits: any | null;

  @ApiProperty({
    example: { conflictGroup: 'CG_PURCHASE_BASE', stackPolicy: 'EXCLUSIVE', priorityRank: 1 },
  })
  conflict: any;

  @ApiProperty({ example: 'BASE_PURCHASE' })
  earningDomain: string;

  @ApiProperty({ example: '2025-01-01T00:00:00Z', nullable: true })
  activeFrom: Date | null;

  @ApiProperty({ example: null, nullable: true })
  activeTo: Date | null;
}

export class GetRewardRulesResponse {
  @ApiProperty({ type: [RewardRuleDto] })
  rules: RewardRuleDto[];

  constructor(rules: RewardRule[]) {
    this.rules = rules.map((r) => ({
      id: r.id,
      programId: r.programId,
      name: r.name,
      description: r.description,
      trigger: r.trigger,
      status: r.status,
      pointsFormula: r.pointsFormula,
      limits: r.limits,
      conflict: r.conflict,
      earningDomain: r.earningDomain,
      activeFrom: r.activeFrom,
      activeTo: r.activeTo,
    }));
  }
}

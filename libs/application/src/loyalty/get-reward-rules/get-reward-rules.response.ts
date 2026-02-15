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

  @ApiProperty({
    example: { tenantId: 1, programId: 1, storeId: null, branchId: null, channel: null },
  })
  scope: any;

  @ApiProperty({
    example: {
      minTierId: null,
      maxTierId: null,
      membershipStatus: ['active'],
      minAmount: 10,
      maxAmount: null,
    },
    nullable: true,
  })
  eligibility: any;

  @ApiProperty({ example: { type: 'rate', rate: 0.1 } })
  pointsFormula: any;

  @ApiProperty({ example: { frequency: 'per-event', perPeriodCap: 1000 }, nullable: true })
  limits: any | null;

  @ApiProperty({
    example: { conflictGroup: 'CG_PURCHASE_BASE', stackPolicy: 'EXCLUSIVE', priorityRank: 1 },
  })
  conflict: any;

  @ApiProperty({
    example: { strategy: 'default', bucketTimezone: null, periodDays: null },
  })
  idempotencyScope: any;

  @ApiProperty({ example: 'BASE_PURCHASE' })
  earningDomain: string;

  @ApiProperty({ example: 1 })
  version: number;

  @ApiProperty({ example: '2025-01-01T00:00:00Z', nullable: true })
  activeFrom: Date | null;

  @ApiProperty({ example: null, nullable: true })
  activeTo: Date | null;

  @ApiProperty({ example: '2025-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00Z' })
  updatedAt: Date;
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
      scope: r.scope,
      eligibility: r.eligibility,
      pointsFormula: r.pointsFormula,
      limits: r.limits,
      conflict: r.conflict,
      idempotencyScope: r.idempotencyScope,
      earningDomain: r.earningDomain,
      version: r.version,
      activeFrom: r.activeFrom,
      activeTo: r.activeTo,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { RewardRule } from '@libs/domain';

export class GetRewardRuleResponse {
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

  @ApiProperty({
    example: { tenantId: 1, programId: 1, storeId: null, branchId: null, channel: null },
  })
  scope: any;

  @ApiProperty({ example: { minTierId: null, maxTierId: null } })
  eligibility: any;

  @ApiProperty({ example: { type: 'rate', rate: 0.1, amountField: 'netAmount' } })
  pointsFormula: any;

  @ApiProperty({ example: { frequency: 'per-event', perPeriodCap: 1000 }, nullable: true })
  limits: any | null;

  @ApiProperty({
    example: { conflictGroup: 'CG_PURCHASE_BASE', stackPolicy: 'EXCLUSIVE', priorityRank: 1 },
  })
  conflict: any;

  @ApiProperty({ example: { strategy: 'default', bucketTimezone: null } })
  idempotencyScope: any;

  @ApiProperty({ example: 'BASE_PURCHASE' })
  earningDomain: string;

  @ApiProperty({ example: 'active', enum: ['active', 'inactive', 'draft'] })
  status: string;

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

  constructor(rule: RewardRule) {
    this.id = rule.id;
    this.programId = rule.programId;
    this.name = rule.name;
    this.description = rule.description;
    this.trigger = rule.trigger;
    this.scope = rule.scope;
    this.eligibility = rule.eligibility;
    this.pointsFormula = rule.pointsFormula;
    this.limits = rule.limits;
    this.conflict = rule.conflict;
    this.idempotencyScope = rule.idempotencyScope;
    this.earningDomain = rule.earningDomain;
    this.status = rule.status;
    this.version = rule.version;
    this.activeFrom = rule.activeFrom;
    this.activeTo = rule.activeTo;
    this.createdAt = rule.createdAt;
    this.updatedAt = rule.updatedAt;
  }
}

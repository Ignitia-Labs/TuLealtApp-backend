import { ApiProperty } from '@nestjs/swagger';
import { LoyaltyProgram, RewardRule } from '@libs/domain';

export class RewardRuleSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Recompensa por Compra' })
  name: string;

  @ApiProperty({
    example: 'PURCHASE',
    enum: ['VISIT', 'PURCHASE', 'REFERRAL', 'SUBSCRIPTION', 'RETENTION', 'CUSTOM'],
  })
  trigger: string;

  @ApiProperty({ example: 'active', enum: ['active', 'inactive'] })
  status: string;
}

export class GetLoyaltyProgramResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  tenantId: number;

  @ApiProperty({ example: 'Programa Base' })
  name: string;

  @ApiProperty({ example: 'Descripción del programa', nullable: true })
  description: string | null;

  @ApiProperty({
    example: 'BASE',
    enum: ['BASE', 'PROMO', 'PARTNER', 'SUBSCRIPTION', 'EXPERIMENTAL'],
  })
  programType: string;

  @ApiProperty({ example: 'active', enum: ['active', 'inactive', 'draft'] })
  status: string;

  @ApiProperty({ example: 1 })
  priorityRank: number;

  @ApiProperty({ example: { allowed: true } })
  stacking: any;

  @ApiProperty({ example: { enabled: true, type: 'simple', daysToExpire: 365 } })
  expirationPolicy: any;

  @ApiProperty({ example: 'GTQ', nullable: true })
  currency: string | null;

  @ApiProperty({ example: 100 })
  minPointsToRedeem: number;

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

  @ApiProperty({ example: [{ domain: 'BASE_PURCHASE' }] })
  earningDomains: Array<{ domain: string }>;

  @ApiProperty({ example: null, nullable: true })
  limits: any | null;

  @ApiProperty({ type: [RewardRuleSummaryDto], description: 'Resumen de reglas del programa' })
  rules: RewardRuleSummaryDto[];

  @ApiProperty({ example: 150, description: 'Número de enrollments activos' })
  enrollmentsCount: number;

  constructor(program: LoyaltyProgram, rules: RewardRule[], enrollmentsCount: number) {
    this.id = program.id;
    this.tenantId = program.tenantId;
    this.name = program.name;
    this.description = program.description;
    this.programType = program.programType;
    this.status = program.status;
    this.priorityRank = program.priorityRank;
    this.stacking = program.stacking;
    this.expirationPolicy = program.expirationPolicy;
    this.currency = program.currency;
    this.minPointsToRedeem = program.minPointsToRedeem;
    this.version = program.version;
    this.activeFrom = program.activeFrom;
    this.activeTo = program.activeTo;
    this.createdAt = program.createdAt;
    this.updatedAt = program.updatedAt;
    this.earningDomains = program.earningDomains;
    this.limits = program.limits;
    this.rules = rules.map((r) => ({
      id: r.id,
      name: r.name,
      trigger: r.trigger,
      status: r.status,
    }));
    this.enrollmentsCount = enrollmentsCount;
  }
}

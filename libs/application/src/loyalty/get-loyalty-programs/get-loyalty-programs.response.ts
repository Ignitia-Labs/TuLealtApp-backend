import { ApiProperty } from '@nestjs/swagger';
import { LoyaltyProgram } from '@libs/domain';

export class LoyaltyProgramDto {
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

  @ApiProperty({ example: { enabled: true, type: 'simple', daysToExpire: 365 }, nullable: true })
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
}

export class GetLoyaltyProgramsResponse {
  @ApiProperty({ type: [LoyaltyProgramDto] })
  programs: LoyaltyProgramDto[];

  constructor(programs: LoyaltyProgram[]) {
    this.programs = programs.map((p) => ({
      id: p.id,
      tenantId: p.tenantId,
      name: p.name,
      description: p.description,
      programType: p.programType,
      status: p.status,
      priorityRank: p.priorityRank,
      stacking: p.stacking,
      expirationPolicy: p.expirationPolicy,
      currency: p.currency,
      minPointsToRedeem: p.minPointsToRedeem,
      version: p.version,
      activeFrom: p.activeFrom,
      activeTo: p.activeTo,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      earningDomains: p.earningDomains,
      limits: p.limits,
    }));
  }
}

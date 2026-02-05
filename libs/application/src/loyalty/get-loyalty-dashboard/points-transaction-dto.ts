import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para transacciones de puntos en el dashboard de lealtad
 * Estructura completa de PointsTransaction para respuesta API
 */
export class LoyaltyDashboardPointsTransactionDto {
  @ApiProperty({ example: 1001 })
  id: number;

  @ApiProperty({ example: 'EARNING', enum: ['EARNING', 'REDEEM', 'ADJUSTMENT', 'REVERSAL', 'EXPIRATION', 'HOLD', 'RELEASE'] })
  type: 'EARNING' | 'REDEEM' | 'ADJUSTMENT' | 'REVERSAL' | 'EXPIRATION' | 'HOLD' | 'RELEASE';

  @ApiProperty({ example: 100, description: 'Delta de puntos (positivo para EARNING, negativo para REDEEM)' })
  pointsDelta: number;

  @ApiProperty({ example: 'PURCHASE_BASE', nullable: true })
  reasonCode: string | null;

  @ApiProperty({ example: 'event-123-456', nullable: true })
  sourceEventId: string | null;

  @ApiProperty({ example: '2025-01-29T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-01-29T10:00:00Z', nullable: true })
  expiresAt: string | null;

  @ApiProperty({
    example: { tenantId: 1, userId: 100 },
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  metadata: Record<string, unknown> | null;

  @ApiProperty({ example: 5, nullable: true })
  programId: number | null;

  @ApiProperty({ example: 10, nullable: true })
  rewardRuleId: number | null;

  @ApiProperty({ example: 100 })
  membershipId: number;

  constructor(
    id: number,
    type: 'EARNING' | 'REDEEM' | 'ADJUSTMENT' | 'REVERSAL' | 'EXPIRATION' | 'HOLD' | 'RELEASE',
    pointsDelta: number,
    reasonCode: string | null,
    sourceEventId: string | null,
    createdAt: Date,
    expiresAt: Date | null,
    metadata: Record<string, unknown> | null,
    programId: number | null,
    rewardRuleId: number | null,
    membershipId: number,
  ) {
    this.id = id;
    this.type = type;
    this.pointsDelta = pointsDelta;
    this.reasonCode = reasonCode;
    this.sourceEventId = sourceEventId;
    this.createdAt = createdAt.toISOString();
    this.expiresAt = expiresAt ? expiresAt.toISOString() : null;
    this.metadata = metadata;
    this.programId = programId;
    this.rewardRuleId = rewardRuleId;
    this.membershipId = membershipId;
  }
}

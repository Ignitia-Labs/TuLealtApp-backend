import { ApiProperty } from '@nestjs/swagger';
import { CustomerTier, TierStatus } from '@libs/domain';

export class NextTierDto {
  @ApiProperty({ example: 3 })
  tierId: number;

  @ApiProperty({ example: 'Platinum' })
  tierName: string;

  @ApiProperty({ example: 1000 })
  requiredPoints: number;

  @ApiProperty({ example: 500 })
  pointsNeeded: number;
}

export class TierBenefitDto {
  @ApiProperty({ example: 'Descuento 10%' })
  name: string;

  @ApiProperty({ example: 'Descuento del 10% en todas las compras' })
  description: string;
}

export class TierStatusDto {
  @ApiProperty({ example: 'active', enum: ['active', 'grace_period', 'expired'] })
  status: string;

  @ApiProperty({ example: '2025-01-15T10:00:00Z', nullable: true })
  effectiveFrom: Date | null;

  @ApiProperty({ example: null, nullable: true })
  effectiveTo: Date | null;

  @ApiProperty({ example: null, nullable: true })
  gracePeriodEndsAt: Date | null;
}

// Helper para determinar status del tier
function getTierStatus(tierStatus: TierStatus | null): string {
  if (!tierStatus) {
    return 'active';
  }
  const now = new Date();
  if (tierStatus.isInGracePeriod(now)) {
    return 'grace_period';
  }
  return 'active';
}

export class GetCurrentTierResponse {
  @ApiProperty({ example: 2, nullable: true })
  tierId: number | null;

  @ApiProperty({ example: 'Gold', nullable: true })
  tierName: string | null;

  @ApiProperty({ example: 500 })
  currentPoints: number;

  @ApiProperty({ type: NextTierDto, nullable: true })
  nextTier: NextTierDto | null;

  @ApiProperty({ type: [TierBenefitDto] })
  benefits: TierBenefitDto[];

  @ApiProperty({ type: TierStatusDto })
  status: TierStatusDto;

  constructor(
    membership: { points: number; tierId: number | null },
    currentTier: CustomerTier | null,
    nextTier: CustomerTier | null,
    tierStatus: TierStatus | null,
  ) {
    this.tierId = currentTier?.id || null;
    this.tierName = currentTier?.name || null;
    this.currentPoints = membership.points;

    if (nextTier) {
      this.nextTier = {
        tierId: nextTier.id,
        tierName: nextTier.name,
        requiredPoints: nextTier.minPoints,
        pointsNeeded: Math.max(0, nextTier.minPoints - membership.points),
      };
    } else {
      this.nextTier = null;
    }

    // Convertir benefits
    this.benefits = (currentTier?.benefits || []).map((benefit: any) => ({
      name: benefit.name || 'Beneficio',
      description: benefit.description || '',
    }));

    // Convertir status
    if (tierStatus) {
      this.status = {
        status: getTierStatus(tierStatus),
        effectiveFrom: tierStatus.since,
        effectiveTo: null, // TierStatus no tiene effectiveTo
        gracePeriodEndsAt: tierStatus.graceUntil,
      };
    } else {
      this.status = {
        status: 'active',
        effectiveFrom: null,
        effectiveTo: null,
        gracePeriodEndsAt: null,
      };
    }
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { TierStatus, CustomerTier } from '@libs/domain';

export class TierHistoryItemDto {
  @ApiProperty({ example: 2, nullable: true })
  tierId: number | null;

  @ApiProperty({ example: 'Gold', nullable: true })
  tierName: string | null;

  @ApiProperty({ example: 'upgrade', enum: ['upgrade', 'downgrade', 'initial_assignment'] })
  changeType: string;

  @ApiProperty({ example: '2025-01-15T10:00:00Z' })
  changedAt: Date;

  @ApiProperty({ example: 500 })
  pointsAtChange: number;
}

export class GetTierHistoryResponse {
  @ApiProperty({ type: [TierHistoryItemDto] })
  history: TierHistoryItemDto[];

  constructor(
    tierStatus: TierStatus | null,
    currentTier: CustomerTier | null,
    currentPoints: number,
  ) {
    // Por ahora solo retornamos el estado actual ya que no hay historial completo
    // Se puede mejorar agregando una tabla de historial de cambios de tier
    this.history = [];
    if (tierStatus && tierStatus.currentTierId) {
      this.history.push({
        tierId: tierStatus.currentTierId,
        tierName: currentTier?.name || null,
        changeType: 'initial_assignment', // No podemos determinar el tipo sin historial
        changedAt: tierStatus.since,
        pointsAtChange: currentPoints, // Aproximación
      });
    }
  }
}

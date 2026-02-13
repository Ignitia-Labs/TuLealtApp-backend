import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de response para canjear una recompensa
 */
export class RedeemRewardResponse {
  @ApiProperty({
    description: 'ID de la transacción REDEEM creada',
    example: 123,
    type: Number,
  })
  transactionId: number;

  @ApiProperty({
    description: 'ID de la recompensa canjeada',
    example: 1,
    type: Number,
  })
  rewardId: number;

  @ApiProperty({
    description: 'Puntos utilizados en el canje',
    example: 100,
    type: Number,
  })
  pointsUsed: number;

  @ApiProperty({
    description: 'Nuevo balance de puntos después del canje',
    example: 50,
    type: Number,
  })
  newBalance: number;

  @ApiPropertyOptional({
    description: 'ID de la sucursal donde se realizó el canje',
    example: 2,
    type: Number,
  })
  branchId?: number | null;

  @ApiPropertyOptional({
    description: 'Código único de canje generado (opcional)',
    example: 'REWARD-ABC123-XYZ789',
    type: String,
  })
  redemptionCode?: string;

  @ApiPropertyOptional({
    description: 'Fecha de expiración del código de canje (UTC)',
    example: '2026-02-12T10:15:00.000Z',
    type: Date,
  })
  expiresAt?: Date | null;

  constructor(data: {
    transactionId: number;
    rewardId: number;
    pointsUsed: number;
    newBalance: number;
    branchId?: number | null;
    redemptionCode?: string;
    expiresAt?: Date | null;
  }) {
    this.transactionId = data.transactionId;
    this.rewardId = data.rewardId;
    this.pointsUsed = data.pointsUsed;
    this.newBalance = data.newBalance;
    this.branchId = data.branchId;
    this.redemptionCode = data.redemptionCode;
    this.expiresAt = data.expiresAt;
  }
}

import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({
    description: 'Código único de canje generado (opcional)',
    example: 'REWARD-ABC123-XYZ789',
    type: String,
    required: false,
  })
  redemptionCode?: string;

  constructor(data: {
    transactionId: number;
    rewardId: number;
    pointsUsed: number;
    newBalance: number;
    redemptionCode?: string;
  }) {
    this.transactionId = data.transactionId;
    this.rewardId = data.rewardId;
    this.pointsUsed = data.pointsUsed;
    this.newBalance = data.newBalance;
    this.redemptionCode = data.redemptionCode;
  }
}

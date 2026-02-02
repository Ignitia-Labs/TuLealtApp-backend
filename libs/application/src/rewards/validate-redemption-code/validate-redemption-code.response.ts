import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para validar un código de canje
 */
export class ValidateRedemptionCodeResponse {
  @ApiProperty({
    description: 'ID del código de canje',
    example: 1,
    type: Number,
  })
  redemptionCodeId: number;

  @ApiProperty({
    description: 'Código de canje validado',
    example: 'REWARD-ABC123-XYZ789',
    type: String,
  })
  code: string;

  @ApiProperty({
    description: 'ID de la transacción REDEEM asociada',
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
    description: 'Nombre de la recompensa',
    example: 'Descuento del 10%',
    type: String,
  })
  rewardName: string;

  @ApiProperty({
    description: 'Categoría de la recompensa',
    example: 'Descuentos',
    type: String,
  })
  rewardCategory: string;

  @ApiProperty({
    description: 'Puntos utilizados en el canje',
    example: 500,
    type: Number,
  })
  pointsUsed: number;

  @ApiProperty({
    description: 'ID de la membership del cliente',
    example: 1,
    type: Number,
  })
  membershipId: number;

  @ApiProperty({
    description: 'Estado del código después de la validación',
    example: 'used',
    enum: ['pending', 'used', 'expired', 'cancelled'],
  })
  status: 'pending' | 'used' | 'expired' | 'cancelled';

  @ApiProperty({
    description: 'Fecha en que se validó el código',
    example: '2026-02-02T10:30:00Z',
    type: Date,
    nullable: true,
  })
  usedAt: Date | null;

  constructor(data: {
    redemptionCodeId: number;
    code: string;
    transactionId: number;
    rewardId: number;
    rewardName: string;
    rewardCategory: string;
    pointsUsed: number;
    membershipId: number;
    status: 'pending' | 'used' | 'expired' | 'cancelled';
    usedAt: Date | null;
  }) {
    this.redemptionCodeId = data.redemptionCodeId;
    this.code = data.code;
    this.transactionId = data.transactionId;
    this.rewardId = data.rewardId;
    this.rewardName = data.rewardName;
    this.rewardCategory = data.rewardCategory;
    this.pointsUsed = data.pointsUsed;
    this.membershipId = data.membershipId;
    this.status = data.status;
    this.usedAt = data.usedAt;
  }
}

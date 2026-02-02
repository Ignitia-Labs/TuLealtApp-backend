import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO que representa un código de canje en la respuesta
 */
export class RedemptionCodeDto {
  @ApiProperty({
    description: 'ID del código de canje',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Código único de canje',
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
    description: 'Estado del código',
    example: 'pending',
    enum: ['pending', 'used', 'expired', 'cancelled'],
  })
  status: 'pending' | 'used' | 'expired' | 'cancelled';

  @ApiProperty({
    description: 'Fecha de expiración',
    example: '2026-03-02T10:30:00Z',
    type: Date,
    nullable: true,
  })
  expiresAt: Date | null;

  @ApiProperty({
    description: 'Fecha en que se usó el código',
    example: '2026-02-02T10:30:00Z',
    type: Date,
    nullable: true,
  })
  usedAt: Date | null;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2026-02-02T10:30:00Z',
    type: Date,
  })
  createdAt: Date;
}

/**
 * DTO de response para obtener códigos de canje de un cliente
 */
export class GetCustomerRedemptionCodesResponse {
  @ApiProperty({
    description: 'Lista de códigos de canje',
    type: [RedemptionCodeDto],
  })
  codes: RedemptionCodeDto[];

  @ApiProperty({
    description: 'Total de códigos encontrados',
    example: 10,
    type: Number,
  })
  total: number;

  @ApiProperty({
    description: 'Página actual',
    example: 1,
    type: Number,
  })
  page: number;

  @ApiProperty({
    description: 'Límite de resultados por página',
    example: 20,
    type: Number,
  })
  limit: number;

  constructor(
    codes: RedemptionCodeDto[],
    total: number,
    page: number,
    limit: number,
  ) {
    this.codes = codes;
    this.total = total;
    this.page = page;
    this.limit = limit;
  }
}

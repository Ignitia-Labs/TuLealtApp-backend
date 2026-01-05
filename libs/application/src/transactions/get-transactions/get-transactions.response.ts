import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de transacción para respuesta
 */
export class TransactionDto {
  @ApiProperty({
    description: 'ID único de la transacción',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID del usuario propietario de la transacción',
    example: 1,
    type: Number,
  })
  userId: number;

  @ApiProperty({
    description: 'ID de la membership asociada a la transacción (opcional)',
    example: 1,
    type: Number,
    nullable: true,
    required: false,
  })
  membershipId: number | null;

  @ApiProperty({
    description: 'Tipo de transacción',
    example: 'earn',
    enum: ['earn', 'redeem', 'expire', 'adjust'],
    enumName: 'TransactionType',
  })
  type: 'earn' | 'redeem' | 'expire' | 'adjust';

  @ApiProperty({
    description: 'Cantidad de puntos (positivo para ganar, negativo para canjear/expirar)',
    example: 100,
    type: Number,
  })
  points: number;

  @ApiProperty({
    description: 'Descripción de la transacción',
    example: 'Puntos ganados por compra',
    type: String,
  })
  description: string;

  @ApiProperty({
    description: 'Metadatos adicionales de la transacción (objeto JSON)',
    example: { orderId: 123, branchId: 1 },
    type: Object,
    nullable: true,
  })
  metadata: Record<string, any> | null;

  @ApiProperty({
    description: 'Estado de la transacción',
    example: 'completed',
    enum: ['completed', 'pending', 'failed', 'cancelled'],
    enumName: 'TransactionStatus',
  })
  status: 'completed' | 'pending' | 'failed' | 'cancelled';

  @ApiProperty({
    description: 'Fecha de creación de la transacción',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización de la transacción',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(
    id: number,
    userId: number,
    membershipId: number | null,
    type: 'earn' | 'redeem' | 'expire' | 'adjust',
    points: number,
    description: string,
    metadata: Record<string, any> | null,
    status: 'completed' | 'pending' | 'failed' | 'cancelled',
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.userId = userId;
    this.membershipId = membershipId;
    this.type = type;
    this.points = points;
    this.description = description;
    this.metadata = metadata;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

/**
 * DTO de response para obtener transacciones
 */
export class GetTransactionsResponse {
  @ApiProperty({
    description: 'Lista de transacciones',
    type: TransactionDto,
    isArray: true,
  })
  transactions: TransactionDto[];

  @ApiProperty({
    description: 'Total de transacciones del usuario',
    example: 50,
    type: Number,
  })
  total: number;

  constructor(transactions: TransactionDto[], total: number) {
    this.transactions = transactions;
    this.total = total;
  }
}

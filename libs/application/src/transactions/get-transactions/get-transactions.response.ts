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

  @ApiProperty({
    description: 'ID del cajero que procesa la transacción',
    example: 10,
    type: Number,
    nullable: true,
    required: false,
  })
  cashierId: number | null;

  @ApiProperty({
    description: 'Fecha de la transacción',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
    nullable: true,
    required: false,
  })
  transactionDate: Date | null;

  @ApiProperty({
    description: 'Monto total de la transacción (con impuestos)',
    example: 150.0,
    type: Number,
    nullable: true,
    required: false,
  })
  transactionAmountTotal: number | null;

  @ApiProperty({
    description: 'Monto neto de la transacción (sin impuestos)',
    example: 129.31,
    type: Number,
    nullable: true,
    required: false,
  })
  netAmount: number | null;

  @ApiProperty({
    description: 'Monto de impuestos',
    example: 20.69,
    type: Number,
    nullable: true,
    required: false,
  })
  taxAmount: number | null;

  @ApiProperty({
    description: 'Cantidad de items en la transacción',
    example: 3,
    type: Number,
    nullable: true,
    required: false,
  })
  itemsCount: number | null;

  @ApiProperty({
    description: 'Referencia única de la transacción',
    example: 'FAC-001234',
    type: String,
    nullable: true,
    required: false,
  })
  transactionReference: string | null;

  @ApiProperty({
    description: 'Puntos ganados (siempre positivo para earn)',
    example: 150,
    type: Number,
    nullable: true,
    required: false,
  })
  pointsEarned: number | null;

  @ApiProperty({
    description: 'ID de la regla de puntos aplicada',
    example: 5,
    type: Number,
    nullable: true,
    required: false,
  })
  pointsRuleId: number | null;

  @ApiProperty({
    description: 'Multiplicador de puntos aplicado (ej: promo x2)',
    example: 2.0,
    type: Number,
    nullable: true,
    required: false,
  })
  pointsMultiplier: number | null;

  @ApiProperty({
    description: 'Puntos base (antes de promos)',
    example: 75,
    type: Number,
    nullable: true,
    required: false,
  })
  basePoints: number | null;

  @ApiProperty({
    description: 'Puntos bonus (por campañas)',
    example: 75,
    type: Number,
    nullable: true,
    required: false,
  })
  bonusPoints: number | null;

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
    cashierId?: number | null,
    transactionDate?: Date | null,
    transactionAmountTotal?: number | null,
    netAmount?: number | null,
    taxAmount?: number | null,
    itemsCount?: number | null,
    transactionReference?: string | null,
    pointsEarned?: number | null,
    pointsRuleId?: number | null,
    pointsMultiplier?: number | null,
    basePoints?: number | null,
    bonusPoints?: number | null,
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
    this.cashierId = cashierId ?? null;
    this.transactionDate = transactionDate ?? null;
    this.transactionAmountTotal = transactionAmountTotal ?? null;
    this.netAmount = netAmount ?? null;
    this.taxAmount = taxAmount ?? null;
    this.itemsCount = itemsCount ?? null;
    this.transactionReference = transactionReference ?? null;
    this.pointsEarned = pointsEarned ?? null;
    this.pointsRuleId = pointsRuleId ?? null;
    this.pointsMultiplier = pointsMultiplier ?? null;
    this.basePoints = basePoints ?? null;
    this.bonusPoints = bonusPoints ?? null;
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

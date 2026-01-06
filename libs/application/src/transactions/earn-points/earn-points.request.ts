import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsObject, Min, IsDateString } from 'class-validator';

/**
 * Request para acumular puntos (earn)
 */
export class EarnPointsRequest {
  @ApiProperty({
    description: 'Código QR único del customer',
    example: 'QR-USER-10-TENANT-1-A3B5C7',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  qrCode: string;

  @ApiProperty({
    description: 'Cantidad de puntos a acumular (si se proporciona, se usa directamente; si no, se calcula con points rules)',
    example: 150,
    type: Number,
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  points?: number;

  @ApiProperty({
    description: 'Monto de compra en moneda local (requerido si no se proporciona points)',
    example: 150.00,
    type: Number,
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @ApiProperty({
    description: 'Descripción de la transacción',
    example: 'Compra FAC-001234 - Juan',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'ID del cajero que procesa la transacción',
    example: 10,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  cashierId?: number;

  @ApiProperty({
    description: 'Fecha de la transacción (ISO string)',
    example: '2024-01-15T10:30:00.000Z',
    type: String,
    required: false,
  })
  @IsDateString()
  @IsOptional()
  transactionDate?: string;

  @ApiProperty({
    description: 'Monto total de la transacción (con impuestos)',
    example: 150.00,
    type: Number,
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  transactionAmountTotal?: number;

  @ApiProperty({
    description: 'Monto neto de la transacción (sin impuestos)',
    example: 129.31,
    type: Number,
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  netAmount?: number;

  @ApiProperty({
    description: 'Monto de impuestos',
    example: 20.69,
    type: Number,
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  taxAmount?: number;

  @ApiProperty({
    description: 'Cantidad de items en la transacción',
    example: 3,
    type: Number,
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  itemsCount?: number;

  @ApiProperty({
    description: 'Referencia única de la transacción (número de factura, ticket, etc.)',
    example: 'FAC-001234',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  transactionReference?: string;

  @ApiProperty({
    description: 'Metadata adicional de la transacción',
    example: {
      orderId: 'FAC-001234',
      branchId: 5,
    },
    type: Object,
    required: false,
    nullable: true,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}


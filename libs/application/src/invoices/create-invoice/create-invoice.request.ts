import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min, IsOptional, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para un item de factura
 */
export class InvoiceItemRequest {
  @ApiProperty({
    description: 'ID único del item dentro de la factura',
    example: '1',
    type: String,
  })
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Descripción del item',
    example: 'Suscripción conecta - monthly',
    type: String,
  })
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Cantidad',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Precio unitario',
    example: 99.99,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  unitPrice: number;

  @ApiProperty({
    description: 'Porcentaje de impuesto',
    example: 16.0,
    type: Number,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  taxRate?: number;

  @ApiProperty({
    description: 'Porcentaje de descuento',
    example: 10.0,
    type: Number,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discountPercent?: number;
}

/**
 * DTO de request para crear una factura
 */
export class CreateInvoiceRequest {
  @ApiProperty({
    description: 'ID de la suscripción asociada',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  subscriptionId: number;

  @ApiProperty({
    description: 'ID del ciclo de facturación asociado (opcional)',
    example: 1,
    type: Number,
    minimum: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  billingCycleId?: number;

  @ApiProperty({
    description: 'Fecha de emisión',
    example: '2024-02-01T00:00:00.000Z',
    type: Date,
  })
  @IsDateString()
  @IsNotEmpty()
  issueDate: string;

  @ApiProperty({
    description: 'Fecha límite de pago',
    example: '2024-02-08T23:59:59.999Z',
    type: Date,
  })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @ApiProperty({
    description: 'Items de la factura',
    type: InvoiceItemRequest,
    isArray: true,
    example: [
      {
        id: '1',
        description: 'Suscripción conecta - monthly',
        quantity: 1,
        unitPrice: 99.99,
        taxRate: 16.0,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemRequest)
  items: InvoiceItemRequest[];

  @ApiProperty({
    description: 'Subtotal de la factura (ya calculado, opcional)',
    example: 147.25,
    type: Number,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  subtotal?: number;

  @ApiProperty({
    description: 'Monto de impuestos (ya calculado, opcional)',
    example: 17.67,
    type: Number,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  taxAmount?: number;

  @ApiProperty({
    description: 'Descuento total aplicado',
    example: 10.0,
    type: Number,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discountAmount?: number;

  @ApiProperty({
    description: 'Créditos aplicados',
    example: 0,
    type: Number,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  creditApplied?: number;

  @ApiProperty({
    description: 'Moneda de la factura',
    example: 'USD',
    type: String,
    required: false,
    default: 'USD',
  })
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Notas adicionales',
    example: 'Factura generada automáticamente',
    type: String,
    required: false,
  })
  @IsOptional()
  notes?: string;
}


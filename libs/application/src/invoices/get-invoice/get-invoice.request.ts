import { IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener una factura
 */
export class GetInvoiceRequest {
  @ApiProperty({
    description: 'ID de la factura',
    example: 1,
    type: Number,
    required: false,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  invoiceId?: number;

  @ApiProperty({
    description: 'Número de factura (formato: INV-YYYY-NNN)',
    example: 'INV-2024-001',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  invoiceNumber?: string;
}


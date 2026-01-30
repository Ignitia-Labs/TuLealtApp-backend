import { IsInt, Min, IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePointsReversalRequest {
  // membershipId viene del parámetro de ruta :id, no del body
  membershipId?: number;

  @ApiProperty({
    example: 1001,
    description: 'ID de la transacción original a revertir',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  transactionId: number;

  @ApiProperty({
    example: 'REFUND',
    description: 'Código de razón para la reversión (ej: REFUND, CHARGEBACK)',
  })
  @IsString()
  @IsNotEmpty()
  reasonCode: string;

  @ApiProperty({
    example: { refundReason: 'Customer requested refund' },
    description: 'Metadatos adicionales (opcional)',
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

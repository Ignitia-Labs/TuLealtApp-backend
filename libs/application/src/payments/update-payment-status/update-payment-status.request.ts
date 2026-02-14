import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

/**
 * Request para actualizar el estado de un pago
 */
export class UpdatePaymentStatusRequest {
  @ApiProperty({
    description: 'ID del pago a actualizar',
    example: 123,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  paymentId: number;

  @ApiProperty({
    description: 'Nuevo estado del pago',
    enum: ['validated', 'rejected'],
    example: 'validated',
  })
  @IsEnum(['validated', 'rejected'])
  @IsNotEmpty()
  newStatus: 'validated' | 'rejected';

  @ApiProperty({
    description: 'Razón del rechazo (requerido si newStatus es rejected)',
    example: 'Comprobante de pago inválido',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.newStatus === 'rejected')
  @IsNotEmpty({ message: 'Rejection reason is required when rejecting a payment' })
  rejectionReason?: string;

  @ApiProperty({
    description: 'ID del usuario que procesa la actualización',
    example: 5,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  processedBy: number;
}

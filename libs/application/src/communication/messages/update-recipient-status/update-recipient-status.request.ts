import { IsNotEmpty, IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecipientStatus } from '@libs/domain';

/**
 * DTO de request para actualizar estado de destinatario
 */
export class UpdateRecipientStatusRequest {
  @ApiProperty({
    description: 'Nuevo estado del destinatario',
    enum: ['sent', 'delivered', 'read', 'failed'],
  })
  @IsEnum(['sent', 'delivered', 'read', 'failed'])
  @IsNotEmpty()
  status: RecipientStatus;

  @ApiPropertyOptional({
    description: 'Fecha de entrega (ISO string)',
  })
  @IsDateString()
  @IsOptional()
  deliveredAt?: string;

  @ApiPropertyOptional({
    description: 'Fecha de lectura (ISO string)',
  })
  @IsDateString()
  @IsOptional()
  readAt?: string;

  @ApiPropertyOptional({
    description: 'Razón del fallo (solo si status = "failed")',
  })
  @IsString()
  @IsOptional()
  failureReason?: string | null;
}

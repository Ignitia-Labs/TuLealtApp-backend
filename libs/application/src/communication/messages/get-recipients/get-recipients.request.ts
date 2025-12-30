import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RecipientStatus } from '@libs/domain';

/**
 * DTO de request para obtener destinatarios
 */
export class GetRecipientsRequest {
  @ApiPropertyOptional({
    description: 'Filtrar por estado de entrega',
    enum: ['sent', 'delivered', 'read', 'failed'],
  })
  @IsEnum(['sent', 'delivered', 'read', 'failed'])
  @IsOptional()
  status?: RecipientStatus;
}


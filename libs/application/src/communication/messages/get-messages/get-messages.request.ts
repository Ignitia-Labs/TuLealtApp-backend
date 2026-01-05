import { IsOptional, IsEnum, IsString, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO de request para obtener mensajes
 */
export class GetMessagesRequest {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    enum: ['urgent', 'informative', 'promotional', 'payment_reminder', 'general'],
  })
  @IsEnum(['urgent', 'informative', 'promotional', 'payment_reminder', 'general'])
  @IsOptional()
  type?: 'urgent' | 'informative' | 'promotional' | 'payment_reminder' | 'general';

  @ApiPropertyOptional({
    enum: ['notification', 'email', 'whatsapp', 'sms'],
  })
  @IsEnum(['notification', 'email', 'whatsapp', 'sms'])
  @IsOptional()
  channel?: 'notification' | 'email' | 'whatsapp' | 'sms';

  @ApiPropertyOptional({
    enum: ['draft', 'sent', 'delivered', 'read', 'failed'],
  })
  @IsEnum(['draft', 'sent', 'delivered', 'read', 'failed'])
  @IsOptional()
  status?: 'draft' | 'sent' | 'delivered' | 'read' | 'failed';

  @ApiPropertyOptional({
    enum: ['single', 'broadcast', 'filtered'],
  })
  @IsEnum(['single', 'broadcast', 'filtered'])
  @IsOptional()
  recipientType?: 'single' | 'broadcast' | 'filtered';

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z' })
  @IsString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z' })
  @IsString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ example: 'pago' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  partnerId?: number;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  senderId?: number;
}

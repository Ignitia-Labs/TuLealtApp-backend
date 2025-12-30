import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO para attachments
 */
class AttachmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsNumber()
  size: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  url: string;
}

/**
 * DTO de request para crear un mensaje
 */
export class CreateMessageRequest {
  @ApiProperty({
    description: 'Asunto del mensaje',
    example: 'Asunto del mensaje',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'Cuerpo del mensaje con variables ya reemplazadas',
    example: 'Cuerpo del mensaje...',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({
    description: 'Tipo de mensaje',
    enum: ['urgent', 'informative', 'promotional', 'payment_reminder', 'general'],
  })
  @IsEnum(['urgent', 'informative', 'promotional', 'payment_reminder', 'general'])
  @IsNotEmpty()
  type: 'urgent' | 'informative' | 'promotional' | 'payment_reminder' | 'general';

  @ApiProperty({
    description: 'Canal de envío',
    enum: ['notification', 'email', 'whatsapp', 'sms'],
  })
  @IsEnum(['notification', 'email', 'whatsapp', 'sms'])
  @IsNotEmpty()
  channel: 'notification' | 'email' | 'whatsapp' | 'sms';

  @ApiProperty({
    description: 'Tipo de destinatario',
    enum: ['single', 'broadcast', 'filtered'],
  })
  @IsEnum(['single', 'broadcast', 'filtered'])
  @IsNotEmpty()
  recipientType: 'single' | 'broadcast' | 'filtered';

  @ApiPropertyOptional({
    description: 'IDs de partners (requerido si recipientType = "single")',
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  partnerIds?: number[];

  @ApiPropertyOptional({
    description: 'ID de la plantilla usada',
  })
  @IsNumber()
  @IsOptional()
  templateId?: number | null;

  @ApiPropertyOptional({
    description: 'Variables para reemplazar en el template',
    example: { partnerName: 'Acme Corp', amount: '79.99', currency: 'USD' },
  })
  @IsObject()
  @IsOptional()
  variables?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Fecha programada de envío (ISO string)',
  })
  @IsString()
  @IsOptional()
  scheduledAt?: string | null;

  @ApiPropertyOptional({
    description: 'Tags para categorización',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Notas internas',
  })
  @IsString()
  @IsOptional()
  notes?: string | null;

  @ApiPropertyOptional({
    description: 'Archivos adjuntos',
    type: [AttachmentDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  @IsOptional()
  attachments?: AttachmentDto[];

  @ApiPropertyOptional({
    description: 'Filtros para mensajes tipo "filtered"',
    example: { plan: 'inspira', countryId: 1, status: 'active' },
  })
  @IsOptional()
  filters?: Record<string, any>;
}


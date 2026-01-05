import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageTemplateType } from '@libs/domain';

/**
 * DTO de request para obtener plantillas
 */
export class GetTemplatesRequest {
  @ApiProperty({
    description: 'Filtrar por tipo de mensaje',
    enum: ['urgent', 'informative', 'promotional', 'payment_reminder', 'general'],
    required: false,
  })
  @IsEnum(['urgent', 'informative', 'promotional', 'payment_reminder', 'general'])
  @IsOptional()
  type?: MessageTemplateType;

  @ApiProperty({
    description: 'Filtrar por estado activo',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Búsqueda por nombre',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;
}

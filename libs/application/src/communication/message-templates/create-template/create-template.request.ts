import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageTemplateType } from '@libs/domain';

/**
 * DTO de request para crear una plantilla de mensaje
 */
export class CreateTemplateRequest {
  @ApiProperty({
    description: 'Nombre de la plantilla',
    example: 'Recordatorio de Pago',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Tipo de mensaje',
    example: 'payment_reminder',
    enum: ['urgent', 'informative', 'promotional', 'payment_reminder', 'general'],
  })
  @IsEnum(['urgent', 'informative', 'promotional', 'payment_reminder', 'general'])
  @IsNotEmpty()
  type: MessageTemplateType;

  @ApiProperty({
    description: 'Asunto del mensaje (puede contener variables {{variableName}})',
    example: 'Recordatorio: Pago de Suscripción Pendiente',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'Cuerpo del mensaje (puede contener variables {{variableName}})',
    example: 'Hola {{partnerName}}, te recordamos que tienes un pago pendiente...',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({
    description: 'Array de nombres de variables disponibles en el template',
    example: ['partnerName', 'amount', 'currency'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  variables: string[];

  @ApiProperty({
    description: 'Indica si la plantilla está activa',
    example: true,
    type: Boolean,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}


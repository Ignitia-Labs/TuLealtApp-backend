import { IsOptional, IsString, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para actualizar una plantilla
 */
export class UpdateTemplateRequest {
  @ApiProperty({
    description: 'Nombre de la plantilla',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Asunto del mensaje',
    required: false,
  })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({
    description: 'Cuerpo del mensaje',
    required: false,
  })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiProperty({
    description: 'Array de nombres de variables',
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variables?: string[];

  @ApiProperty({
    description: 'Indica si la plantilla está activa',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

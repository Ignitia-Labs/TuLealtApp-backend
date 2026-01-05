import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsBoolean } from 'class-validator';

/**
 * DTO de request para obtener perfiles
 */
export class GetProfilesRequest {
  @ApiProperty({
    description: 'ID del partner para filtrar (opcional, null = perfiles globales)',
    example: 1,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  partnerId?: number | null;

  @ApiProperty({
    description: 'Si se incluyen perfiles inactivos en la respuesta',
    example: false,
    type: Boolean,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  includeInactive?: boolean;
}

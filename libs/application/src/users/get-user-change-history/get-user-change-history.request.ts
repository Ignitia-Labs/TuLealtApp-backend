import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener el historial de cambios de un usuario
 */
export class GetUserChangeHistoryRequest {
  @ApiProperty({
    description: 'ID del usuario del cual obtener el historial',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    description: 'Número de registros a omitir (paginación)',
    example: 0,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  skip?: number;

  @ApiProperty({
    description: 'Número de registros a tomar (paginación)',
    example: 50,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  take?: number;
}


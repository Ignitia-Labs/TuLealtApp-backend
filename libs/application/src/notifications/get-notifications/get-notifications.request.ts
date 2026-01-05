import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener notificaciones
 */
export class GetNotificationsRequest {
  @ApiProperty({
    description: 'ID del usuario',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  userId: number;

  @ApiProperty({
    description: 'Número de página (para paginación)',
    example: 0,
    type: Number,
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  skip?: number;

  @ApiProperty({
    description: 'Cantidad de elementos por página',
    example: 20,
    type: Number,
    required: false,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  take?: number;

  @ApiProperty({
    description: 'Solo notificaciones no leídas',
    example: false,
    type: Boolean,
    required: false,
  })
  @IsOptional()
  unreadOnly?: boolean;
}

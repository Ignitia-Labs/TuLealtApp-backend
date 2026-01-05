import { IsOptional, IsNumber, IsString, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener todas las suscripciones
 */
export class GetSubscriptionsRequest {
  @ApiProperty({
    description: 'ID del partner para filtrar suscripciones',
    example: 1,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  partnerId?: number;

  @ApiProperty({
    description: 'Estado de la suscripción para filtrar',
    example: 'active',
    enum: ['active', 'expired', 'suspended', 'cancelled', 'trialing', 'past_due', 'paused'],
    required: false,
  })
  @IsEnum(['active', 'expired', 'suspended', 'cancelled', 'trialing', 'past_due', 'paused'])
  @IsOptional()
  status?: 'active' | 'expired' | 'suspended' | 'cancelled' | 'trialing' | 'past_due' | 'paused';

  @ApiProperty({
    description: 'Tipo de plan para filtrar',
    example: 'conecta',
    enum: ['esencia', 'conecta', 'inspira'],
    required: false,
  })
  @IsEnum(['esencia', 'conecta', 'inspira'])
  @IsOptional()
  planType?: 'esencia' | 'conecta' | 'inspira';

  @ApiProperty({
    description:
      'Número de página. Si no se proporciona, retorna todos los resultados sin paginación',
    example: 1,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiProperty({
    description:
      'Cantidad de elementos por página. Si no se proporciona junto con page, retorna todos los resultados sin paginación',
    example: 10,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;
}

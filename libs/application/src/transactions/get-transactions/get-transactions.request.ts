import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener transacciones
 */
export class GetTransactionsRequest {
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
    description: 'Tipo de transacción para filtrar',
    example: 'earn',
    enum: ['earn', 'redeem', 'expire', 'adjust'],
    required: false,
  })
  @IsOptional()
  type?: 'earn' | 'redeem' | 'expire' | 'adjust';

  @ApiProperty({
    description: 'ID de la membership para filtrar transacciones',
    example: 1,
    type: Number,
    required: false,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  membershipId?: number;
}


import { IsNumber, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener usuarios de un partner
 */
export class GetPartnerUsersRequest {
  @ApiProperty({
    description: 'ID del partner',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  partnerId: number;

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


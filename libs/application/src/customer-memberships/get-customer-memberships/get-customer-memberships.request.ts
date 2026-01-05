import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

/**
 * DTO de request para obtener memberships de un usuario
 */
export class GetCustomerMembershipsRequest {
  @ApiProperty({
    description:
      'ID del usuario para filtrar las memberships. Si no se proporciona, se usa el userId del token JWT',
    example: 1,
    type: Number,
    minimum: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  userId?: number;

  @ApiProperty({
    description: 'ID del tenant para filtrar las memberships (opcional)',
    example: 1,
    type: Number,
    minimum: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  tenantId?: number;

  @ApiProperty({
    description: 'Si es true, solo retorna memberships activas',
    example: true,
    type: Boolean,
    required: false,
    default: false,
  })
  @IsOptional()
  activeOnly?: boolean;
}

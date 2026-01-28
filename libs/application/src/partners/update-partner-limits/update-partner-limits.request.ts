import { IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para actualizar los límites de un partner
 * Todos los campos son opcionales para permitir actualización parcial
 */
export class UpdatePartnerLimitsRequest {
  @ApiProperty({
    description: 'Número máximo de tenants permitidos',
    example: 10,
    type: Number,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-1)
  maxTenants?: number;

  @ApiProperty({
    description: 'Número máximo de branches permitidas',
    example: 50,
    type: Number,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-1)
  maxBranches?: number;

  @ApiProperty({
    description: 'Número máximo de clientes permitidos',
    example: 10000,
    type: Number,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-1)
  maxCustomers?: number;

  @ApiProperty({
    description: 'Número máximo de recompensas permitidas',
    example: 100,
    type: Number,
    minimum: -1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-1)
  maxRewards?: number;

  @ApiProperty({
    description: 'Número máximo de administradores permitidos (-1 para ilimitado)',
    example: -1,
    type: Number,
    minimum: -1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-1)
  maxAdmins?: number;

  @ApiProperty({
    description: 'Almacenamiento en GB permitido (-1 para ilimitado)',
    example: -1,
    type: Number,
    minimum: -1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-1)
  storageGB?: number;

  @ApiProperty({
    description: 'Número máximo de llamadas API por mes (-1 para ilimitado)',
    example: -1,
    type: Number,
    minimum: -1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-1)
  apiCallsPerMonth?: number;
}

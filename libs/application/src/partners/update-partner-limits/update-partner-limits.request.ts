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
  @Min(0)
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
  @Min(0)
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
  @Min(0)
  maxCustomers?: number;

  @ApiProperty({
    description: 'Número máximo de recompensas permitidas',
    example: 100,
    type: Number,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxRewards?: number;
}


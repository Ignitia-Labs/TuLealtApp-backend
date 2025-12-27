import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para actualizar un registro de uso de suscripción
 */
export class UpdateSubscriptionUsageRequest {
  @ApiProperty({
    description: 'ID de la suscripción',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  partnerSubscriptionId: number;

  @ApiProperty({
    description: 'Número de tenants',
    example: 2,
    type: Number,
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  tenantsCount?: number;

  @ApiProperty({
    description: 'Número de branches',
    example: 8,
    type: Number,
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  branchesCount?: number;

  @ApiProperty({
    description: 'Número de customers',
    example: 2345,
    type: Number,
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  customersCount?: number;

  @ApiProperty({
    description: 'Número de rewards',
    example: 15,
    type: Number,
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  rewardsCount?: number;
}


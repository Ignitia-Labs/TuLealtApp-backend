import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para crear un registro de uso de suscripción
 */
export class CreateSubscriptionUsageRequest {
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
    default: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  tenantsCount?: number;

  @ApiProperty({
    description: 'Número de branches',
    example: 8,
    type: Number,
    required: false,
    default: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  branchesCount?: number;

  @ApiProperty({
    description: 'Número de customers',
    example: 2345,
    type: Number,
    required: false,
    default: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  customersCount?: number;

  @ApiProperty({
    description: 'Número de rewards',
    example: 15,
    type: Number,
    required: false,
    default: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  rewardsCount?: number;
}


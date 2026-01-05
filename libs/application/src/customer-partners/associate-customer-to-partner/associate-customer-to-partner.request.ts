import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min, IsOptional, IsObject } from 'class-validator';

/**
 * DTO de request para asociar un customer a un partner
 */
export class AssociateCustomerToPartnerRequest {
  @ApiProperty({
    description: 'ID del usuario (customer)',
    example: 10,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  userId: number;

  @ApiProperty({
    description: 'ID del partner',
    example: 5,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  partnerId: number;

  @ApiProperty({
    description: 'ID del tenant específico del partner',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  tenantId: number;

  @ApiProperty({
    description: 'ID de la branch donde se registró el customer',
    example: 5,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  registrationBranchId: number;

  @ApiProperty({
    description: 'Metadatos adicionales en formato JSON (opcional)',
    example: { source: 'web', campaign: 'summer2024' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

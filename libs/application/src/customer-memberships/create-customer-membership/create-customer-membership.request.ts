import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min, IsOptional } from 'class-validator';

/**
 * DTO de request para crear una membership
 */
export class CreateCustomerMembershipRequest {
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
    description: 'ID del tenant (merchant)',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  tenantId: number;

  @ApiProperty({
    description: 'ID de la branch donde se registró el customer (opcional)',
    example: 5,
    type: Number,
    minimum: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  registrationBranchId?: number;

  @ApiProperty({
    description: 'Puntos iniciales (opcional, por defecto 0)',
    example: 0,
    type: Number,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  points?: number;

  @ApiProperty({
    description: 'Estado inicial (opcional, por defecto active)',
    example: 'active',
    enum: ['active', 'inactive'],
    required: false,
  })
  @IsOptional()
  status?: 'active' | 'inactive';
}

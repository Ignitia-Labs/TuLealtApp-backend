import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min, IsString, IsIn } from 'class-validator';

/**
 * DTO de request para actualizar el status de una asociación customer-partner
 */
export class UpdateCustomerPartnerStatusRequest {
  @ApiProperty({
    description: 'ID de la asociación customer-partner',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  associationId: number;

  @ApiProperty({
    description: 'Nuevo status de la asociación',
    example: 'active',
    enum: ['active', 'inactive', 'suspended'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['active', 'inactive', 'suspended'])
  status: 'active' | 'inactive' | 'suspended';
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min, IsOptional, IsString, IsIn } from 'class-validator';

/**
 * DTO de request para obtener los partners de un customer
 */
export class GetCustomerPartnersRequest {
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
    description: 'Filtrar por status (opcional)',
    example: 'active',
    enum: ['active', 'inactive', 'suspended'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['active', 'inactive', 'suspended'])
  status?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min } from 'class-validator';

/**
 * DTO de request para obtener un nivel de cliente por ID
 */
export class GetCustomerTierRequest {
  @ApiProperty({
    description: 'ID único del nivel de cliente',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  customerTierId: number;
}


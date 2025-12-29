import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min } from 'class-validator';

/**
 * DTO de request para obtener niveles de clientes por tenant
 */
export class GetCustomerTiersRequest {
  @ApiProperty({
    description: 'ID del tenant para filtrar los niveles de clientes',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  tenantId: number;
}


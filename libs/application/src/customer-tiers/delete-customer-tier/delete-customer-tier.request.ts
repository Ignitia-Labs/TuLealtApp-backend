import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para eliminar un nivel de cliente
 */
export class DeleteCustomerTierRequest {
  @ApiProperty({
    description: 'ID del nivel de cliente a eliminar',
    example: 1,
    type: Number,
  })
  customerTierId: number;
}

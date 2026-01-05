import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min } from 'class-validator';

/**
 * DTO de request para desasociar un customer de un partner
 */
export class DissociateCustomerFromPartnerRequest {
  @ApiProperty({
    description: 'ID de la asociación customer-partner a eliminar',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  associationId: number;
}

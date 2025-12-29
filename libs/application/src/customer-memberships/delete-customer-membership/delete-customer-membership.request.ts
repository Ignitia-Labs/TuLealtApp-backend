import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min } from 'class-validator';

/**
 * DTO de request para eliminar una membership
 */
export class DeleteCustomerMembershipRequest {
  @ApiProperty({
    description: 'ID de la membership a eliminar',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  membershipId: number;
}


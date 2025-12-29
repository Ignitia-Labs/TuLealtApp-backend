import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min } from 'class-validator';

/**
 * DTO de request para obtener una membership específica
 */
export class GetCustomerMembershipRequest {
  @ApiProperty({
    description: 'ID de la membership',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  membershipId: number;
}


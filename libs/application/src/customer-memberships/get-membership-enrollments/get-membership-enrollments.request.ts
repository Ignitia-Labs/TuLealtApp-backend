import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Request DTO para obtener enrollments de una membership
 */
export class GetMembershipEnrollmentsRequest {
  @ApiProperty({
    description: 'ID de la membership',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  membershipId: number;
}

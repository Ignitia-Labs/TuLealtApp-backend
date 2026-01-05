import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para eliminar una membership
 */
export class DeleteCustomerMembershipResponse {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Membership deleted successfully',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'ID de la membership eliminada',
    example: 1,
    type: Number,
  })
  membershipId: number;

  constructor(membershipId: number) {
    this.membershipId = membershipId;
    this.message = 'Membership deleted successfully';
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { CustomerMembershipDto } from '../dto/customer-membership.dto';

/**
 * DTO de response para actualizar una membership
 */
export class UpdateCustomerMembershipResponse {
  @ApiProperty({
    description: 'Información de la membership actualizada',
    type: CustomerMembershipDto,
  })
  membership: CustomerMembershipDto;

  constructor(membership: CustomerMembershipDto) {
    this.membership = membership;
  }
}


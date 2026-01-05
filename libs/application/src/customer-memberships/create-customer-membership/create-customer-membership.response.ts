import { ApiProperty } from '@nestjs/swagger';
import { CustomerMembershipDto } from '../dto/customer-membership.dto';

/**
 * DTO de response para crear una membership
 */
export class CreateCustomerMembershipResponse {
  @ApiProperty({
    description: 'Información de la membership creada',
    type: CustomerMembershipDto,
  })
  membership: CustomerMembershipDto;

  constructor(membership: CustomerMembershipDto) {
    this.membership = membership;
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { CustomerMembershipDto } from '../dto/customer-membership.dto';

/**
 * DTO de response para obtener una membership específica
 */
export class GetCustomerMembershipResponse {
  @ApiProperty({
    description: 'Información de la membership',
    type: CustomerMembershipDto,
  })
  membership: CustomerMembershipDto;

  constructor(membership: CustomerMembershipDto) {
    this.membership = membership;
  }
}


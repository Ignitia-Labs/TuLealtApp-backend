import { ApiProperty } from '@nestjs/swagger';
import { CustomerMembershipDto } from '../dto/customer-membership.dto';

/**
 * DTO de response para obtener memberships de un usuario
 */
export class GetCustomerMembershipsResponse {
  @ApiProperty({
    description: 'Lista de memberships del usuario',
    type: CustomerMembershipDto,
    isArray: true,
  })
  memberships: CustomerMembershipDto[];

  @ApiProperty({
    description: 'Total de memberships encontradas',
    example: 3,
    type: Number,
  })
  total: number;

  constructor(memberships: CustomerMembershipDto[], total: number) {
    this.memberships = memberships;
    this.total = total;
  }
}

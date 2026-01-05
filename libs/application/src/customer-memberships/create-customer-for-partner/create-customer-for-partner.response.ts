import { ApiProperty } from '@nestjs/swagger';
import { CustomerMembershipDto } from '../dto/customer-membership.dto';

/**
 * DTO de response para crear un customer desde Partner API
 */
export class CreateCustomerForPartnerResponse {
  @ApiProperty({
    description: 'ID del usuario creado o existente',
    example: 10,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'customer@example.com',
    type: String,
  })
  email: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'John Doe',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Fecha de creación del usuario',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Membership creada para el usuario',
    type: CustomerMembershipDto,
  })
  membership: CustomerMembershipDto;

  @ApiProperty({
    description: 'Indica si el usuario fue creado (true) o ya existía (false)',
    example: true,
    type: Boolean,
  })
  userCreated: boolean;

  constructor(
    id: number,
    email: string,
    name: string,
    createdAt: Date,
    membership: CustomerMembershipDto,
    userCreated: boolean,
  ) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.createdAt = createdAt;
    this.membership = membership;
    this.userCreated = userCreated;
  }
}


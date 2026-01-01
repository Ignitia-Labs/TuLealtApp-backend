import { ApiProperty } from '@nestjs/swagger';
import { CreateUserResponse } from '../create-user/create-user.response';

/**
 * DTO de response para crear un usuario PARTNER
 * Extiende CreateUserResponse y agrega partnerId
 */
export class CreatePartnerUserResponse extends CreateUserResponse {
  @ApiProperty({
    description: 'ID del partner al que pertenece el usuario',
    example: 1,
    type: Number,
  })
  partnerId: number | null;

  constructor(
    id: number,
    email: string,
    name: string,
    firstName: string,
    lastName: string,
    phone: string,
    profile: Record<string, any> | null,
    roles: string[],
    isActive: boolean,
    createdAt: Date,
    partnerId: number | null,
  ) {
    super(id, email, name, firstName, lastName, phone, profile, roles, isActive, createdAt);
    this.partnerId = partnerId;
  }
}


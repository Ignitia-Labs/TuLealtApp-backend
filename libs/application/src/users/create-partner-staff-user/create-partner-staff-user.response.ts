import { ApiProperty } from '@nestjs/swagger';
import { CreateUserResponse } from '../create-user/create-user.response';

/**
 * DTO de response para crear un usuario PARTNER_STAFF
 * Extiende CreateUserResponse y agrega partnerId y profileIds asignados
 */
export class CreatePartnerStaffUserResponse extends CreateUserResponse {
  @ApiProperty({
    description: 'ID del partner al que pertenece el usuario',
    example: 1,
    type: Number,
  })
  partnerId: number | null;

  @ApiProperty({
    description: 'IDs de los perfiles asignados al usuario',
    example: [1, 2],
    type: [Number],
  })
  assignedProfileIds: number[];

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
    assignedProfileIds: number[],
  ) {
    super(id, email, name, firstName, lastName, phone, profile, roles, isActive, createdAt);
    this.partnerId = partnerId;
    this.assignedProfileIds = assignedProfileIds;
  }
}

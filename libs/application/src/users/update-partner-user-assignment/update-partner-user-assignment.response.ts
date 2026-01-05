import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO para actualizar la asignación de tenant y branch a un usuario partner
 */
export class UpdatePartnerUserAssignmentResponse {
  @ApiProperty({
    description: 'ID del usuario',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'partner@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Partner User',
  })
  name: string;

  @ApiProperty({
    description: 'ID del partner asociado',
    example: 1,
    nullable: true,
  })
  partnerId: number | null;

  @ApiProperty({
    description: 'ID del tenant asociado',
    example: 5,
    nullable: true,
  })
  tenantId: number | null;

  @ApiProperty({
    description: 'ID del branch asociado',
    example: 10,
    nullable: true,
  })
  branchId: number | null;

  @ApiProperty({
    description: 'Roles del usuario',
    example: ['PARTNER'],
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-01-20T14:45:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(
    id: number,
    email: string,
    name: string,
    partnerId: number | null,
    tenantId: number | null,
    branchId: number | null,
    roles: string[],
    updatedAt: Date,
  ) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.partnerId = partnerId;
    this.tenantId = tenantId;
    this.branchId = branchId;
    this.roles = roles;
    this.updatedAt = updatedAt;
  }
}

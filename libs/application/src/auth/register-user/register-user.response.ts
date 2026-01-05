import { ApiProperty } from '@nestjs/swagger';
import { CustomerMembershipDto } from '../../customer-memberships/dto/customer-membership.dto';

/**
 * DTO de response para registrar un usuario
 * Incluye información de la membership si se creó automáticamente
 */
export class RegisterUserResponse {
  @ApiProperty({
    description: 'ID del usuario creado',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'customer@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Fecha de creación del usuario',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description:
      'Información de la membership creada automáticamente (si se proporcionaron tenantId y registrationBranchId)',
    type: CustomerMembershipDto,
    required: false,
    nullable: true,
  })
  membership: CustomerMembershipDto | null;

  constructor(
    id: number,
    email: string,
    name: string,
    createdAt: Date,
    membership: CustomerMembershipDto | null = null,
  ) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.createdAt = createdAt;
    this.membership = membership;
  }
}

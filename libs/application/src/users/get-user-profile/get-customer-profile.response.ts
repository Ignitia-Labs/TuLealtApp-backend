import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para obtener el perfil de un cliente (customer)
 * Versión simplificada que no incluye información de partner/tenant/branch
 * ya que estos campos no son relevantes para usuarios de tipo CUSTOMER
 */
export class GetCustomerProfileResponse {
  @ApiProperty({
    description: 'ID del usuario',
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
    description: 'Nombre del usuario',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'Teléfono del usuario',
    example: '+1234567890',
  })
  phone: string;

  @ApiProperty({
    description: 'Perfil adicional del usuario',
    example: { preferences: { language: 'es', theme: 'light' } },
    nullable: true,
  })
  profile: Record<string, any> | null;

  @ApiProperty({
    description: 'Roles del usuario',
    example: ['CUSTOMER'],
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    description: 'Indica si el usuario está activo',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de creación del usuario',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del usuario',
    example: '2024-01-20T14:45:00.000Z',
    type: Date,
  })
  updatedAt: Date;

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
    updatedAt: Date,
  ) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.profile = profile;
    this.roles = roles;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Crea un GetCustomerProfileResponse desde un GetUserProfileResponse
   * Filtra los campos relacionados con partner/tenant/branch
   */
  static fromUserProfile(userProfile: any): GetCustomerProfileResponse {
    return new GetCustomerProfileResponse(
      userProfile.id,
      userProfile.email,
      userProfile.name,
      userProfile.firstName,
      userProfile.lastName,
      userProfile.phone,
      userProfile.profile,
      userProfile.roles,
      userProfile.isActive,
      userProfile.createdAt,
      userProfile.updatedAt,
    );
  }
}

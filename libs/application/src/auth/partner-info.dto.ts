import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para información básica del Partner
 */
export class PartnerInfoDto {
  @ApiProperty({
    description: 'ID del partner',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nombre del partner',
    example: 'Mi Empresa',
  })
  name: string;

  @ApiProperty({
    description: 'Dominio del partner',
    example: 'miempresa.gt',
  })
  domain: string;

  @ApiProperty({
    description: 'Email del partner',
    example: 'contacto@miempresa.gt',
  })
  email: string;

  @ApiProperty({
    description: 'Estado del partner',
    example: 'active',
    enum: ['active', 'suspended', 'inactive'],
  })
  status: 'active' | 'suspended' | 'inactive';

  constructor(id: number, name: string, domain: string, email: string, status: 'active' | 'suspended' | 'inactive') {
    this.id = id;
    this.name = name;
    this.domain = domain;
    this.email = email;
    this.status = status;
  }
}


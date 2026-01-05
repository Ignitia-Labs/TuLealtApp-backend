import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para información básica del Tenant
 */
export class TenantInfoDto {
  @ApiProperty({
    description: 'ID del tenant',
    example: 5,
  })
  id: number;

  @ApiProperty({
    description: 'Nombre del tenant',
    example: 'Tienda Principal',
  })
  name: string;

  @ApiProperty({
    description: 'ID del partner al que pertenece el tenant',
    example: 1,
  })
  partnerId: number;

  @ApiProperty({
    description: 'Estado del tenant',
    example: 'active',
    enum: ['active', 'inactive', 'suspended'],
  })
  status: 'active' | 'inactive' | 'suspended';

  constructor(
    id: number,
    name: string,
    partnerId: number,
    status: 'active' | 'inactive' | 'suspended',
  ) {
    this.id = id;
    this.name = name;
    this.partnerId = partnerId;
    this.status = status;
  }
}

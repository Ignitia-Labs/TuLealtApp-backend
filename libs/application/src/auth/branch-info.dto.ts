import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para información básica del Branch
 */
export class BranchInfoDto {
  @ApiProperty({
    description: 'ID del branch',
    example: 10,
  })
  id: number;

  @ApiProperty({
    description: 'Nombre del branch',
    example: 'Sucursal Centro',
  })
  name: string;

  @ApiProperty({
    description: 'ID del tenant al que pertenece el branch',
    example: 5,
  })
  tenantId: number;

  @ApiProperty({
    description: 'Estado del branch',
    example: 'active',
    enum: ['active', 'inactive', 'closed'],
  })
  status: 'active' | 'inactive' | 'closed';

  constructor(id: number, name: string, tenantId: number, status: 'active' | 'inactive' | 'closed') {
    this.id = id;
    this.name = name;
    this.tenantId = tenantId;
    this.status = status;
  }
}


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
    description: 'Código único de búsqueda rápida de la branch (para QR code)',
    example: 'BRANCH-ABC234',
    type: String,
  })
  quickSearchCode: string;

  @ApiProperty({
    description: 'Estado del branch',
    example: 'active',
    enum: ['active', 'inactive', 'closed'],
  })
  status: 'active' | 'inactive' | 'closed';

  constructor(
    id: number,
    name: string,
    tenantId: number,
    quickSearchCode: string,
    status: 'active' | 'inactive' | 'closed',
  ) {
    this.id = id;
    this.name = name;
    this.tenantId = tenantId;
    this.quickSearchCode = quickSearchCode;
    this.status = status;
  }
}

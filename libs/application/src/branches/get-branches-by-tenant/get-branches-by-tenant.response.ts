import { ApiProperty } from '@nestjs/swagger';
import { GetBranchResponse } from '../get-branch/get-branch.response';

/**
 * DTO de response para obtener branches por tenant
 */
export class GetBranchesByTenantResponse {
  @ApiProperty({
    description: 'Lista de branches del tenant',
    type: GetBranchResponse,
    isArray: true,
    example: [
      {
        id: 1,
        tenantId: 1,
        name: 'Café Delicia - Centro',
        address: 'Calle Principal 123, Zona 1',
        city: 'Guatemala City',
        country: 'Guatemala',
        phone: '+502 1234-5678',
        email: 'centro@cafedelicia.com',
        status: 'active',
        createdAt: '2024-01-05T00:00:00.000Z',
        updatedAt: '2024-01-05T00:00:00.000Z',
      },
      {
        id: 2,
        tenantId: 1,
        name: 'Café Delicia - Zona 10',
        address: 'Avenida Reforma 456, Zona 10',
        city: 'Guatemala City',
        country: 'Guatemala',
        phone: '+502 2345-6789',
        email: 'zona10@cafedelicia.com',
        status: 'active',
        createdAt: '2024-01-10T00:00:00.000Z',
        updatedAt: '2024-01-10T00:00:00.000Z',
      },
    ],
  })
  branches: GetBranchResponse[];

  constructor(branches: GetBranchResponse[]) {
    this.branches = branches;
  }
}


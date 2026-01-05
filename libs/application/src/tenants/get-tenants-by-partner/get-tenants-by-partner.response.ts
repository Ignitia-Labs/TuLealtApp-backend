import { ApiProperty } from '@nestjs/swagger';
import { GetTenantResponse } from '../get-tenant/get-tenant.response';

/**
 * DTO de response para obtener tenants por partner
 */
export class GetTenantsByPartnerResponse {
  @ApiProperty({
    description: 'Lista de tenants del partner',
    type: GetTenantResponse,
    isArray: true,
    example: [
      {
        id: 1,
        partnerId: 1,
        name: 'Café Delicia',
        description: 'Cafetería gourmet con sabor artesanal',
        logo: 'https://ui-avatars.com/api/?name=Cafe+Delicia&background=ec4899&color=fff',
        category: 'Cafeterías',
        currencyId: 'currency-8',
        primaryColor: '#ec4899',
        secondaryColor: '#fbbf24',
        pointsExpireDays: 365,
        minPointsToRedeem: 100,
        status: 'active',
        createdAt: '2024-01-05T00:00:00.000Z',
        updatedAt: '2024-01-05T00:00:00.000Z',
        qrScanning: true,
        offlineMode: true,
        referralProgram: true,
        birthdayRewards: true,
      },
      {
        id: 2,
        partnerId: 1,
        name: 'Restaurante El Buen Sabor',
        description: 'Restaurante familiar con comida tradicional',
        logo: 'https://ui-avatars.com/api/?name=Restaurante+El+Buen+Sabor&background=4f46e5&color=fff',
        category: 'Restaurantes',
        currencyId: 'currency-8',
        primaryColor: '#4f46e5',
        secondaryColor: '#fbbf24',
        pointsExpireDays: 180,
        minPointsToRedeem: 50,
        status: 'active',
        createdAt: '2024-01-10T00:00:00.000Z',
        updatedAt: '2024-01-10T00:00:00.000Z',
        qrScanning: false,
        offlineMode: true,
        referralProgram: true,
        birthdayRewards: false,
      },
    ],
  })
  tenants: GetTenantResponse[];

  constructor(tenants: GetTenantResponse[]) {
    this.tenants = tenants;
  }
}

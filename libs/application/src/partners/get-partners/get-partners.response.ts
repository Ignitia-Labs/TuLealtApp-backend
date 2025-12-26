import { ApiProperty } from '@nestjs/swagger';
import { GetPartnerResponse } from '../get-partner/get-partner.response';

/**
 * DTO de response para obtener todos los partners
 */
export class GetPartnersResponse {
  @ApiProperty({
    description: 'Lista de partners',
    type: GetPartnerResponse,
    isArray: true,
    example: [
      {
        id: 1,
        name: 'Grupo Comercial ABC',
        responsibleName: 'María González',
        email: 'maria@abc-comercial.com',
        phone: '+502 2345-6789',
        countryId: 1,
        city: 'Ciudad de Guatemala',
        plan: 'conecta',
        logo: 'https://ui-avatars.com/api/?name=Grupo+ABC&background=4f46e5&color=fff',
        category: 'Retail',
        branchesNumber: 5,
        website: 'https://abc-comercial.com',
        socialMedia: '@abccomercial',
        rewardType: 'Por monto de compra',
        currencyId: 'currency-8',
        businessName: 'Grupo Comercial ABC S.A. de C.V.',
        taxId: 'RFC-ABC-123456',
        fiscalAddress: 'Zona 10, Guatemala City, Guatemala',
        paymentMethod: 'Tarjeta de crédito',
        billingEmail: 'facturacion@abc-comercial.com',
        domain: 'abc-comercial.com',
        subscription: {
          planId: 'plan-conecta',
          startDate: '2024-01-01T00:00:00Z',
          renewalDate: '2025-01-01T00:00:00Z',
          status: 'active',
          lastPaymentDate: '2024-01-01T00:00:00Z',
          lastPaymentAmount: 99.0,
          paymentStatus: 'paid',
          autoRenew: true,
        },
        limits: {
          maxTenants: 5,
          maxBranches: 20,
          maxCustomers: 5000,
          maxRewards: 50,
        },
        stats: {
          tenantsCount: 3,
          branchesCount: 8,
          customersCount: 1250,
          rewardsCount: 15,
        },
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-11-01T00:00:00Z',
      },
    ],
  })
  partners: GetPartnerResponse[];

  constructor(partners: GetPartnerResponse[]) {
    this.partners = partners;
  }
}

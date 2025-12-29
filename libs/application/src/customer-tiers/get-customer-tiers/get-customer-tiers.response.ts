import { ApiProperty } from '@nestjs/swagger';
import { CustomerTierDto } from '../dto/customer-tier.dto';

/**
 * DTO de response para obtener niveles de clientes por tenant
 */
export class GetCustomerTiersResponse {
  @ApiProperty({
    description: 'Lista de niveles de clientes del tenant',
    type: CustomerTierDto,
    isArray: true,
    example: [
      {
        id: 1,
        tenantId: 1,
        name: 'Bronce',
        description: 'Nivel inicial para nuevos clientes',
        minPoints: 0,
        maxPoints: 1000,
        color: '#cd7f32',
        benefits: ['Descuento del 5%'],
        multiplier: null,
        icon: 'bronze',
        priority: 1,
        status: 'active',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
      {
        id: 2,
        tenantId: 1,
        name: 'Plata',
        description: 'Nivel intermedio',
        minPoints: 1000,
        maxPoints: 5000,
        color: '#c0c0c0',
        benefits: ['Descuento del 10%', 'Envío gratis'],
        multiplier: 1.05,
        icon: 'silver',
        priority: 2,
        status: 'active',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
      {
        id: 3,
        tenantId: 1,
        name: 'Oro',
        description: 'Nivel avanzado',
        minPoints: 5000,
        maxPoints: null,
        color: '#ffd700',
        benefits: ['Descuento del 15%', 'Envío gratis', 'Acceso a productos exclusivos'],
        multiplier: 1.1,
        icon: 'gold',
        priority: 3,
        status: 'active',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    ],
  })
  tiers: CustomerTierDto[];

  @ApiProperty({
    description: 'Total de niveles encontrados',
    example: 3,
    type: Number,
  })
  total: number;

  constructor(tiers: CustomerTierDto[]) {
    this.tiers = tiers;
    this.total = tiers.length;
  }
}


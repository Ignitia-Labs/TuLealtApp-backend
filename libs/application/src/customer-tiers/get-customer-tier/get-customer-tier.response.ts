import { ApiProperty } from '@nestjs/swagger';
import { CustomerTierDto } from '../dto/customer-tier.dto';

/**
 * DTO de response para obtener un nivel de cliente
 */
export class GetCustomerTierResponse {
  @ApiProperty({
    description: 'Nivel de cliente encontrado',
    type: CustomerTierDto,
    example: {
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
  })
  tier: CustomerTierDto;

  constructor(tier: CustomerTierDto) {
    this.tier = tier;
  }
}


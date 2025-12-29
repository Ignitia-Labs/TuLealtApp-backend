import { ApiProperty } from '@nestjs/swagger';
import { CustomerTierDto } from '../dto/customer-tier.dto';

/**
 * DTO de response para actualizar un nivel de cliente
 */
export class UpdateCustomerTierResponse {
  @ApiProperty({
    description: 'Nivel de cliente actualizado',
    type: CustomerTierDto,
    example: {
      id: 1,
      tenantId: 1,
      name: 'Bronce actualizado',
      description: 'Nivel inicial para nuevos clientes',
      minPoints: 0,
      maxPoints: 1000,
      color: '#cd7f32',
      benefits: ['Descuento del 5%', 'Envío gratis'],
      multiplier: null,
      icon: 'bronze',
      priority: 1,
      status: 'active',
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-20T14:45:00.000Z',
    },
  })
  tier: CustomerTierDto;

  constructor(tier: CustomerTierDto) {
    this.tier = tier;
  }
}


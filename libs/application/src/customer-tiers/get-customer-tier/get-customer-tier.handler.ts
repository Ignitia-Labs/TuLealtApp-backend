import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ICustomerTierRepository } from '@libs/domain';
import { GetCustomerTierRequest } from './get-customer-tier.request';
import { GetCustomerTierResponse } from './get-customer-tier.response';
import { CustomerTierDto } from '../dto/customer-tier.dto';

/**
 * Handler para el caso de uso de obtener un nivel de cliente por ID
 */
@Injectable()
export class GetCustomerTierHandler {
  constructor(
    @Inject('ICustomerTierRepository')
    private readonly customerTierRepository: ICustomerTierRepository,
  ) {}

  async execute(request: GetCustomerTierRequest): Promise<GetCustomerTierResponse> {
    const tier = await this.customerTierRepository.findById(request.customerTierId);

    if (!tier) {
      throw new NotFoundException(`Customer tier with ID ${request.customerTierId} not found`);
    }

    const tierDto = new CustomerTierDto(
      tier.id,
      tier.tenantId,
      tier.name,
      tier.description,
      tier.minPoints,
      tier.maxPoints,
      tier.color,
      tier.benefits,
      tier.multiplier,
      tier.icon,
      tier.priority,
      tier.status,
      tier.createdAt,
      tier.updatedAt,
    );

    return new GetCustomerTierResponse(tierDto);
  }
}


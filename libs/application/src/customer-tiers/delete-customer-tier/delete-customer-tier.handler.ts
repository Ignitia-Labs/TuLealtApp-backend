import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ICustomerTierRepository } from '@libs/domain';
import { DeleteCustomerTierRequest } from './delete-customer-tier.request';
import { DeleteCustomerTierResponse } from './delete-customer-tier.response';

/**
 * Handler para el caso de uso de eliminar un nivel de cliente
 */
@Injectable()
export class DeleteCustomerTierHandler {
  constructor(
    @Inject('ICustomerTierRepository')
    private readonly customerTierRepository: ICustomerTierRepository,
  ) {}

  async execute(request: DeleteCustomerTierRequest): Promise<DeleteCustomerTierResponse> {
    // Verificar que el tier existe
    const tier = await this.customerTierRepository.findById(request.customerTierId);

    if (!tier) {
      throw new NotFoundException(`Customer tier with ID ${request.customerTierId} not found`);
    }

    // Eliminar el tier
    await this.customerTierRepository.delete(request.customerTierId);

    return new DeleteCustomerTierResponse('Customer tier deleted successfully', request.customerTierId);
  }
}


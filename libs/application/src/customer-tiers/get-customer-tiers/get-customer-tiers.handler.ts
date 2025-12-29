import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ITenantRepository, ICustomerTierRepository } from '@libs/domain';
import { GetCustomerTiersRequest } from './get-customer-tiers.request';
import { GetCustomerTiersResponse } from './get-customer-tiers.response';
import { CustomerTierDto } from '../dto/customer-tier.dto';

/**
 * Handler para el caso de uso de obtener niveles de clientes por tenant
 */
@Injectable()
export class GetCustomerTiersHandler {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('ICustomerTierRepository')
    private readonly customerTierRepository: ICustomerTierRepository,
  ) {}

  async execute(request: GetCustomerTiersRequest): Promise<GetCustomerTiersResponse> {
    // Verificar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Obtener todos los tiers del tenant
    const tiers = await this.customerTierRepository.findByTenantId(request.tenantId);

    // Ordenar por prioridad (menor primero) y luego por fecha de creación
    const sortedTiers = tiers.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    // Convertir a DTOs de respuesta
    const tierDtos = sortedTiers.map(
      (tier) =>
        new CustomerTierDto(
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
        ),
    );

    return new GetCustomerTiersResponse(tierDtos);
  }
}


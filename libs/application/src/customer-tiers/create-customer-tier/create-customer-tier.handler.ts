import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ITenantRepository, ICustomerTierRepository, CustomerTier } from '@libs/domain';
import { CreateCustomerTierRequest } from './create-customer-tier.request';
import { CreateCustomerTierResponse } from './create-customer-tier.response';
import { CustomerTierDto } from '../dto/customer-tier.dto';

/**
 * Handler para el caso de uso de crear un nivel de cliente
 */
@Injectable()
export class CreateCustomerTierHandler {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('ICustomerTierRepository')
    private readonly customerTierRepository: ICustomerTierRepository,
  ) {}

  async execute(request: CreateCustomerTierRequest): Promise<CreateCustomerTierResponse> {
    // Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Validar que maxPoints > minPoints si se proporciona maxPoints
    if (request.maxPoints !== null && request.maxPoints !== undefined) {
      if (request.maxPoints <= request.minPoints) {
        throw new BadRequestException('maxPoints must be greater than minPoints');
      }
    }

    // Crear la entidad de dominio
    const tier = CustomerTier.create(
      request.tenantId,
      request.name,
      request.minPoints,
      request.color,
      request.benefits || [],
      request.priority ?? 1,
      request.description ?? null,
      request.maxPoints ?? null,
      request.multiplier ?? null,
      request.icon ?? null,
      request.status ?? 'active',
    );

    // Guardar el tier
    const savedTier = await this.customerTierRepository.save(tier);

    // Convertir a DTO
    const tierDto = new CustomerTierDto(
      savedTier.id,
      savedTier.tenantId,
      savedTier.name,
      savedTier.description,
      savedTier.minPoints,
      savedTier.maxPoints,
      savedTier.color,
      savedTier.benefits,
      savedTier.multiplier,
      savedTier.icon,
      savedTier.priority,
      savedTier.status,
      savedTier.createdAt,
      savedTier.updatedAt,
    );

    return new CreateCustomerTierResponse(tierDto);
  }
}

import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ICustomerTierRepository, CustomerTier } from '@libs/domain';
import { UpdateCustomerTierRequest } from './update-customer-tier.request';
import { UpdateCustomerTierResponse } from './update-customer-tier.response';
import { CustomerTierDto } from '../dto/customer-tier.dto';

/**
 * Handler para el caso de uso de actualizar un nivel de cliente
 * Permite actualización parcial (PATCH) de todos los campos
 */
@Injectable()
export class UpdateCustomerTierHandler {
  constructor(
    @Inject('ICustomerTierRepository')
    private readonly customerTierRepository: ICustomerTierRepository,
  ) {}

  async execute(
    customerTierId: number,
    request: UpdateCustomerTierRequest,
  ): Promise<UpdateCustomerTierResponse> {
    // Buscar el tier existente
    const existingTier = await this.customerTierRepository.findById(customerTierId);

    if (!existingTier) {
      throw new NotFoundException(`Customer tier with ID ${customerTierId} not found`);
    }

    // Validar que maxPoints > minPoints si se proporcionan ambos
    const minPoints = request.minPoints !== undefined ? request.minPoints : existingTier.minPoints;
    const maxPoints = request.maxPoints !== undefined ? request.maxPoints : existingTier.maxPoints;

    if (maxPoints !== null && maxPoints !== undefined && maxPoints <= minPoints) {
      throw new BadRequestException('maxPoints must be greater than minPoints');
    }

    // Crear tier actualizado con valores nuevos o existentes
    // Usar el constructor directamente para preservar createdAt y actualizar updatedAt
    const updatedTier = new CustomerTier(
      existingTier.id,
      existingTier.tenantId, // No se puede cambiar el tenantId
      request.name ?? existingTier.name,
      request.description !== undefined ? request.description : existingTier.description,
      minPoints,
      maxPoints,
      request.color ?? existingTier.color,
      request.benefits !== undefined ? request.benefits : existingTier.benefits,
      request.multiplier !== undefined ? request.multiplier : existingTier.multiplier,
      request.icon !== undefined ? request.icon : existingTier.icon,
      request.priority ?? existingTier.priority,
      request.status ?? existingTier.status,
      existingTier.createdAt, // Preservar fecha de creación
      new Date(), // Actualizar fecha de modificación
    );

    // Guardar el tier actualizado
    const savedTier = await this.customerTierRepository.update(updatedTier);

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

    return new UpdateCustomerTierResponse(tierDto);
  }
}

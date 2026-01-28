import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPartnerRepository, PartnerLimits } from '@libs/domain';
import { UpdatePartnerLimitsRequest } from './update-partner-limits.request';
import { UpdatePartnerLimitsResponse } from './update-partner-limits.response';
import { PartnerLimitsEntity, PartnerMapper } from '@libs/infrastructure';
import { PartnerLimitsSwaggerDto } from '../dto/partner-limits-swagger.dto';

/**
 * Handler para el caso de uso de actualizar los límites de un partner
 * Permite actualización parcial (PATCH) de los límites
 */
@Injectable()
export class UpdatePartnerLimitsHandler {
  constructor(
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @InjectRepository(PartnerLimitsEntity)
    private readonly limitsRepository: Repository<PartnerLimitsEntity>,
  ) {}

  async execute(
    partnerId: number,
    request: UpdatePartnerLimitsRequest,
  ): Promise<UpdatePartnerLimitsResponse> {
    try {
      // Verificar que el partner existe
      const partner = await this.partnerRepository.findById(partnerId);
      if (!partner) {
        throw new NotFoundException(`Partner with ID ${partnerId} not found`);
      }

      // Buscar los límites existentes
      const limitsEntity = await this.limitsRepository.findOne({
        where: { partnerId },
      });

      if (!limitsEntity) {
        throw new NotFoundException(`Limits for partner with ID ${partnerId} not found`);
      }

      // Validar que al menos un campo se esté actualizando
      if (
        request.maxTenants === undefined &&
        request.maxBranches === undefined &&
        request.maxCustomers === undefined &&
        request.maxRewards === undefined &&
        request.maxAdmins === undefined &&
        request.storageGB === undefined &&
        request.apiCallsPerMonth === undefined
      ) {
        throw new BadRequestException('At least one limit field must be provided for update');
      }

      // Crear entidad de dominio con valores actualizados
      const updatedLimits = PartnerLimits.create(
        partnerId,
        request.maxTenants !== undefined ? request.maxTenants : limitsEntity.maxTenants,
        request.maxBranches !== undefined ? request.maxBranches : limitsEntity.maxBranches,
        request.maxCustomers !== undefined ? request.maxCustomers : limitsEntity.maxCustomers,
        request.maxRewards !== undefined ? request.maxRewards : limitsEntity.maxRewards,
        request.maxAdmins !== undefined ? request.maxAdmins : (limitsEntity.maxAdmins ?? -1),
        request.storageGB !== undefined ? request.storageGB : (limitsEntity.storageGB ?? -1),
        request.apiCallsPerMonth !== undefined
          ? request.apiCallsPerMonth
          : (limitsEntity.apiCallsPerMonth ?? -1),
        limitsEntity.id,
      );

      // Mapear a entidad de persistencia
      const updatedLimitsEntity = PartnerMapper.limitsToPersistence(updatedLimits);
      updatedLimitsEntity.id = limitsEntity.id;
      updatedLimitsEntity.partnerId = partnerId;
      updatedLimitsEntity.createdAt = limitsEntity.createdAt; // Preservar fecha de creación
      updatedLimitsEntity.updatedAt = new Date(); // Actualizar fecha de modificación

      // Guardar los límites actualizados
      const savedLimitsEntity = await this.limitsRepository.save(updatedLimitsEntity);

      // Mapear a DTO de Swagger
      const limitsDto: PartnerLimitsSwaggerDto = {
        maxTenants: Number(savedLimitsEntity.maxTenants) || 0,
        maxBranches: Number(savedLimitsEntity.maxBranches) || 0,
        maxCustomers: Number(savedLimitsEntity.maxCustomers) || 0,
        maxRewards: Number(savedLimitsEntity.maxRewards) || 0,
        maxAdmins: Number(savedLimitsEntity.maxAdmins ?? -1),
        storageGB: Number(savedLimitsEntity.storageGB ?? -1),
        apiCallsPerMonth: Number(savedLimitsEntity.apiCallsPerMonth ?? -1),
      };

      return new UpdatePartnerLimitsResponse(
        savedLimitsEntity.id,
        savedLimitsEntity.partnerId,
        limitsDto,
        savedLimitsEntity.createdAt,
        savedLimitsEntity.updatedAt,
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Error updating partner limits: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

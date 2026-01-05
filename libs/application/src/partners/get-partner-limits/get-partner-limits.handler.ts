import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPartnerRepository } from '@libs/domain';
import { GetPartnerLimitsRequest } from './get-partner-limits.request';
import { GetPartnerLimitsResponse } from './get-partner-limits.response';
import { PartnerLimitsEntity, PartnerMapper } from '@libs/infrastructure';
import { PartnerLimitsSwaggerDto } from '../dto/partner-limits-swagger.dto';

/**
 * Handler para el caso de uso de obtener los límites de un partner
 */
@Injectable()
export class GetPartnerLimitsHandler {
  constructor(
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @InjectRepository(PartnerLimitsEntity)
    private readonly limitsRepository: Repository<PartnerLimitsEntity>,
  ) {}

  async execute(request: GetPartnerLimitsRequest): Promise<GetPartnerLimitsResponse> {
    try {
      // Verificar que el partner existe
      const partner = await this.partnerRepository.findById(request.partnerId);
      if (!partner) {
        throw new NotFoundException(`Partner with ID ${request.partnerId} not found`);
      }

      // Buscar los límites del partner
      const limitsEntity = await this.limitsRepository.findOne({
        where: { partnerId: request.partnerId },
      });

      if (!limitsEntity) {
        throw new NotFoundException(`Limits for partner with ID ${request.partnerId} not found`);
      }

      // Mapear a DTO de Swagger
      const limitsDto: PartnerLimitsSwaggerDto = {
        maxTenants: Number(limitsEntity.maxTenants) || 0,
        maxBranches: Number(limitsEntity.maxBranches) || 0,
        maxCustomers: Number(limitsEntity.maxCustomers) || 0,
        maxRewards: Number(limitsEntity.maxRewards) || 0,
      };

      return new GetPartnerLimitsResponse(
        limitsEntity.id,
        limitsEntity.partnerId,
        limitsDto,
        limitsEntity.createdAt,
        limitsEntity.updatedAt,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Error retrieving partner limits: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

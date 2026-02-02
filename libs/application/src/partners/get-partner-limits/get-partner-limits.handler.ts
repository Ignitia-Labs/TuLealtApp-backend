import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPartnerRepository, IPricingPlanRepository } from '@libs/domain';
import { GetPartnerLimitsRequest } from './get-partner-limits.request';
import { GetPartnerLimitsResponse } from './get-partner-limits.response';
import { PartnerSubscriptionEntity } from '@libs/infrastructure';
import { SubscriptionUsageHelper } from '@libs/application';
import { PartnerLimitsSwaggerDto } from '../dto/partner-limits-swagger.dto';

/**
 * Handler para el caso de uso de obtener los límites de un partner
 */
@Injectable()
export class GetPartnerLimitsHandler {
  constructor(
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('IPricingPlanRepository')
    private readonly pricingPlanRepository: IPricingPlanRepository,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
  ) {}

  async execute(request: GetPartnerLimitsRequest): Promise<GetPartnerLimitsResponse> {
    try {
      // Verificar que el partner existe
      const partner = await this.partnerRepository.findById(request.partnerId);
      if (!partner) {
        throw new NotFoundException(`Partner with ID ${request.partnerId} not found`);
      }

      // Obtener límites desde pricing_plan_limits
      const planLimits = await SubscriptionUsageHelper.getPlanLimitsForPartner(
        request.partnerId,
        this.subscriptionRepository,
        this.pricingPlanRepository,
      );

      if (!planLimits) {
        throw new NotFoundException(
          `Pricing plan limits not found for partner with ID ${request.partnerId}. Please ensure the partner has an active subscription.`,
        );
      }

      // Mapear a DTO de Swagger
      const limitsDto: PartnerLimitsSwaggerDto = {
        maxTenants: planLimits.maxTenants,
        maxBranches: planLimits.maxBranches,
        maxCustomers: planLimits.maxCustomers,
        maxRewards: planLimits.maxRewards,
        maxAdmins: planLimits.maxAdmins ?? -1,
        storageGB: planLimits.storageGB ?? -1,
        apiCallsPerMonth: planLimits.apiCallsPerMonth ?? -1,
        maxLoyaltyPrograms: planLimits.maxLoyaltyPrograms ?? -1,
        maxLoyaltyProgramsBase: planLimits.maxLoyaltyProgramsBase ?? -1,
        maxLoyaltyProgramsPromo: planLimits.maxLoyaltyProgramsPromo ?? -1,
        maxLoyaltyProgramsPartner: planLimits.maxLoyaltyProgramsPartner ?? -1,
        maxLoyaltyProgramsSubscription: planLimits.maxLoyaltyProgramsSubscription ?? -1,
        maxLoyaltyProgramsExperimental: planLimits.maxLoyaltyProgramsExperimental ?? -1,
      };

      // Usar planLimits.id como id y pricingPlanId como partnerId para mantener compatibilidad con la respuesta
      return new GetPartnerLimitsResponse(
        planLimits.id,
        planLimits.pricingPlanId,
        limitsDto,
        planLimits.createdAt,
        planLimits.updatedAt,
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

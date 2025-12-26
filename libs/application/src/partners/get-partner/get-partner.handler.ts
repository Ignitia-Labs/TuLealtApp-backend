import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPartnerRepository } from '@libs/domain';
import { GetPartnerRequest } from './get-partner.request';
import { GetPartnerResponse } from './get-partner.response';
import { PartnerEntity, PartnerMapper } from '@libs/infrastructure';
import { PartnerSubscriptionSwaggerDto } from '../dto/partner-subscription-swagger.dto';
import { PartnerLimitsSwaggerDto } from '../dto/partner-limits-swagger.dto';
import { PartnerStatsSwaggerDto } from '../dto/partner-stats-swagger.dto';

/**
 * Handler para el caso de uso de obtener un partner por ID
 */
@Injectable()
export class GetPartnerHandler {
  constructor(
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @InjectRepository(PartnerEntity)
    private readonly partnerEntityRepository: Repository<PartnerEntity>,
  ) {}

  async execute(request: GetPartnerRequest): Promise<GetPartnerResponse> {
    try {
      console.log(`[GetPartnerHandler] Buscando partner con ID: ${request.partnerId}`);

      // Intentar obtener con relaciones primero
      let partnerEntity: PartnerEntity | null = null;
      try {
        partnerEntity = await this.partnerEntityRepository.findOne({
          where: { id: request.partnerId },
          relations: ['subscription', 'limits', 'stats'],
        });
      } catch (relationError) {
        console.warn(
          `[GetPartnerHandler] Error al cargar relaciones, intentando sin relaciones:`,
          relationError,
        );
        // Si falla con relaciones, intentar sin ellas
        partnerEntity = await this.partnerEntityRepository.findOne({
          where: { id: request.partnerId },
        });
      }

      if (!partnerEntity) {
        throw new NotFoundException(`Partner with ID ${request.partnerId} not found`);
      }

      console.log(`[GetPartnerHandler] Partner encontrado: ${partnerEntity.name}`);
      console.log(
        `[GetPartnerHandler] Subscription: ${partnerEntity.subscription ? 'existe' : 'null'}`,
      );
      console.log(`[GetPartnerHandler] Limits: ${partnerEntity.limits ? 'existe' : 'null'}`);
      console.log(`[GetPartnerHandler] Stats: ${partnerEntity.stats ? 'existe' : 'null'}`);

      let partner;
      try {
        partner = PartnerMapper.toDomain(
          partnerEntity,
          partnerEntity.subscription || null,
          partnerEntity.limits || null,
          partnerEntity.stats || null,
        );
        console.log(`[GetPartnerHandler] Partner mapeado exitosamente`);
      } catch (mapperError) {
        console.error('[GetPartnerHandler] Error en PartnerMapper.toDomain:', mapperError);
        throw mapperError;
      }

      // Mapear subscription con validación de propiedades
      let subscriptionDto: PartnerSubscriptionSwaggerDto | null = null;
      if (partnerEntity.subscription) {
        try {
          // Validar que las fechas requeridas existan
          const startDate = partnerEntity.subscription.startDate
            ? new Date(partnerEntity.subscription.startDate)
            : new Date();
          const renewalDate = partnerEntity.subscription.renewalDate
            ? new Date(partnerEntity.subscription.renewalDate)
            : new Date();
          const nextBillingDate = partnerEntity.subscription.nextBillingDate
            ? new Date(partnerEntity.subscription.nextBillingDate)
            : new Date();
          const currentPeriodStart = partnerEntity.subscription.currentPeriodStart
            ? new Date(partnerEntity.subscription.currentPeriodStart)
            : new Date();
          const currentPeriodEnd = partnerEntity.subscription.currentPeriodEnd
            ? new Date(partnerEntity.subscription.currentPeriodEnd)
            : new Date();

          subscriptionDto = {
            planId: partnerEntity.subscription.planId || '',
            planType: (partnerEntity.subscription.planType || 'conecta') as
              | 'esencia'
              | 'conecta'
              | 'inspira',
            startDate: startDate,
            renewalDate: renewalDate,
            status: (partnerEntity.subscription.status || 'active') as
              | 'active'
              | 'expired'
              | 'suspended'
              | 'cancelled'
              | 'trialing'
              | 'past_due'
              | 'paused',
            billingFrequency: (partnerEntity.subscription.billingFrequency || 'monthly') as
              | 'monthly'
              | 'quarterly'
              | 'semiannual'
              | 'annual',
            billingAmount: Number(partnerEntity.subscription.billingAmount) || 0,
            currency: partnerEntity.subscription.currency || 'USD',
            nextBillingDate: nextBillingDate,
            nextBillingAmount: Number(partnerEntity.subscription.nextBillingAmount) || 0,
            currentPeriodStart: currentPeriodStart,
            currentPeriodEnd: currentPeriodEnd,
            trialEndDate: partnerEntity.subscription.trialEndDate
              ? new Date(partnerEntity.subscription.trialEndDate)
              : null,
            lastPaymentDate: partnerEntity.subscription.lastPaymentDate
              ? new Date(partnerEntity.subscription.lastPaymentDate)
              : null,
            lastPaymentAmount: partnerEntity.subscription.lastPaymentAmount
              ? Number(partnerEntity.subscription.lastPaymentAmount)
              : null,
            paymentStatus: partnerEntity.subscription.paymentStatus as
              | 'paid'
              | 'pending'
              | 'failed'
              | null,
            autoRenew:
              partnerEntity.subscription.autoRenew !== undefined
                ? partnerEntity.subscription.autoRenew
                : true,
          };
          console.log('[GetPartnerHandler] Subscription DTO creado exitosamente');
        } catch (subscriptionError) {
          console.error('[GetPartnerHandler] Error al mapear subscription:', subscriptionError);
          if (subscriptionError instanceof Error) {
            console.error('[GetPartnerHandler] Subscription error stack:', subscriptionError.stack);
          }
          subscriptionDto = null;
        }
      }

      // Mapear limits con validación
      let limitsDto: PartnerLimitsSwaggerDto | null = null;
      if (partnerEntity.limits) {
        try {
          limitsDto = {
            maxTenants: Number(partnerEntity.limits.maxTenants) || 0,
            maxBranches: Number(partnerEntity.limits.maxBranches) || 0,
            maxCustomers: Number(partnerEntity.limits.maxCustomers) || 0,
            maxRewards: Number(partnerEntity.limits.maxRewards) || 0,
          };
        } catch (limitsError) {
          console.error('Error al mapear limits:', limitsError);
          limitsDto = null;
        }
      }

      // Mapear stats con validación
      let statsDto: PartnerStatsSwaggerDto | null = null;
      if (partnerEntity.stats) {
        try {
          statsDto = {
            tenantsCount: Number(partnerEntity.stats.tenantsCount) || 0,
            branchesCount: Number(partnerEntity.stats.branchesCount) || 0,
            customersCount: Number(partnerEntity.stats.customersCount) || 0,
            rewardsCount: Number(partnerEntity.stats.rewardsCount) || 0,
          };
        } catch (statsError) {
          console.error('Error al mapear stats:', statsError);
          statsDto = null;
        }
      }

      // Formatear currencyId como 'currency-{id}'
      const formattedCurrencyId = partnerEntity.currencyId
        ? `currency-${partnerEntity.currencyId}`
        : 'currency-0';

      console.log(`[GetPartnerHandler] Creando GetPartnerResponse para partner ID: ${partner.id}`);
      console.log(`[GetPartnerHandler] Partner createdAt:`, partner.createdAt);
      console.log(`[GetPartnerHandler] Partner updatedAt:`, partner.updatedAt);

      try {
        const response = new GetPartnerResponse(
          partner.id,
          partner.name || '',
          partner.responsibleName || '',
          partner.email || '',
          partner.phone || '',
          partner.countryId || null,
          partner.city || '',
          partner.plan || '',
          partner.logo || null,
          partner.category || '',
          partner.branchesNumber || 0,
          partner.website || null,
          partner.socialMedia || null,
          partner.rewardType || '',
          formattedCurrencyId,
          partner.businessName || '',
          partner.taxId || '',
          partner.fiscalAddress || '',
          partner.paymentMethod || '',
          partner.billingEmail || '',
          partner.domain || '',
          partner.status || 'active',
          partner.createdAt || new Date(),
          partner.updatedAt || new Date(),
          subscriptionDto,
          limitsDto,
          statsDto,
        );
        console.log(`[GetPartnerHandler] GetPartnerResponse creado exitosamente`);
        return response;
      } catch (responseError) {
        console.error('[GetPartnerHandler] Error al crear GetPartnerResponse:', responseError);
        throw responseError;
      }
    } catch (error) {
      // Si es una excepción conocida, relanzarla
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Para otros errores, loggear y relanzar con un mensaje más descriptivo
      console.error('Error en GetPartnerHandler:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('Stack trace:', errorStack);
      throw new InternalServerErrorException(
        `Error al obtener partner con ID ${request.partnerId}: ${errorMessage}`,
      );
    }
  }
}

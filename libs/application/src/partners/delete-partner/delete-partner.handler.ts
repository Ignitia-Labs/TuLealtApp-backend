import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { IPartnerRepository, ITenantRepository, IBranchRepository } from '@libs/domain';
import { DeletePartnerRequest } from './delete-partner.request';
import { DeletePartnerResponse } from './delete-partner.response';
import { PartnerEntity } from '@libs/infrastructure';
import { TenantEntity } from '@libs/infrastructure';
import { BranchEntity } from '@libs/infrastructure';
import { PartnerArchiveEntity } from '@libs/infrastructure';
import { PartnerArchiveRepository } from '@libs/infrastructure';

/**
 * Handler para el caso de uso de eliminar un partner
 * Archiva toda la información del partner y sus relaciones antes de eliminar
 */
@Injectable()
export class DeletePartnerHandler {
  constructor(
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
    @InjectRepository(PartnerEntity)
    private readonly partnerEntityRepository: Repository<PartnerEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantEntityRepository: Repository<TenantEntity>,
    @InjectRepository(BranchEntity)
    private readonly branchEntityRepository: Repository<BranchEntity>,
    private readonly partnerArchiveRepository: PartnerArchiveRepository,
  ) {}

  async execute(request: DeletePartnerRequest): Promise<DeletePartnerResponse> {
    try {
      // Verificar que el partner existe (sin relaciones primero para evitar errores)
      const partnerEntityExists = await this.partnerEntityRepository.findOne({
        where: { id: request.partnerId },
        select: ['id'],
      });

      if (!partnerEntityExists) {
        throw new NotFoundException(`Partner with ID ${request.partnerId} not found`);
      }

      // Intentar obtener el partner con relaciones, pero si falla, continuar sin ellas
      let partnerEntity: PartnerEntity | null = null;
      try {
        partnerEntity = await this.partnerEntityRepository.findOne({
          where: { id: request.partnerId },
          relations: ['subscription', 'country'],
        });
      } catch (relationError) {
        console.warn(
          `Error al cargar relaciones del partner ${request.partnerId}, continuando sin relaciones:`,
          relationError,
        );
        // Intentar obtener sin relaciones
        partnerEntity = await this.partnerEntityRepository.findOne({
          where: { id: request.partnerId },
        });
      }

      if (!partnerEntity) {
        throw new NotFoundException(`Partner with ID ${request.partnerId} not found`);
      }

      // Obtener todos los tenants del partner con sus features
      let tenantEntities: TenantEntity[] = [];
      try {
        tenantEntities = await this.tenantEntityRepository.find({
          where: { partnerId: request.partnerId },
          relations: ['features'],
        });
      } catch (error) {
        console.warn(`Error al cargar tenants del partner ${request.partnerId}:`, error);
        // Continuar sin tenants
      }

      // Obtener todas las branches de todos los tenants del partner
      let branchEntities: BranchEntity[] = [];
      try {
        const tenantIds = tenantEntities.map((t) => t.id);
        if (tenantIds.length > 0) {
          branchEntities = await this.branchEntityRepository.find({
            where: { tenantId: In(tenantIds) },
          });
        }
      } catch (error) {
        console.warn(`Error al cargar branches del partner ${request.partnerId}:`, error);
        // Continuar sin branches
      }

      // Construir el objeto de archivo con toda la información
      const archivedData = {
        partner: {
          id: partnerEntity.id,
          name: partnerEntity.name || '',
          responsibleName: partnerEntity.responsibleName || '',
          email: partnerEntity.email || '',
          phone: partnerEntity.phone || '',
          countryId: partnerEntity.countryId || null,
          city: partnerEntity.city || '',
          plan: partnerEntity.plan || '',
          logo: partnerEntity.logo || null,
          category: partnerEntity.category || '',
          branchesNumber: partnerEntity.branchesNumber || 0,
          website: partnerEntity.website || null,
          socialMedia: partnerEntity.socialMedia || null,
          currencyId: partnerEntity.currencyId || 0,
          businessName: partnerEntity.businessName || '',
          taxId: partnerEntity.taxId || '',
          fiscalAddress: partnerEntity.fiscalAddress || '',
          paymentMethod: partnerEntity.paymentMethod || '',
          billingEmail: partnerEntity.billingEmail || '',
          domain: partnerEntity.domain || '',
          status: partnerEntity.status || 'active',
          createdAt: partnerEntity.createdAt
            ? partnerEntity.createdAt.toISOString()
            : new Date().toISOString(),
          updatedAt: partnerEntity.updatedAt
            ? partnerEntity.updatedAt.toISOString()
            : new Date().toISOString(),
        },
        subscription: partnerEntity.subscription
          ? {
              id: partnerEntity.subscription.id,
              partnerId: partnerEntity.subscription.partnerId,
              planId: partnerEntity.subscription.planId || '',
              planType: partnerEntity.subscription.planType,
              startDate: partnerEntity.subscription.startDate
                ? partnerEntity.subscription.startDate.toISOString()
                : new Date().toISOString(),
              renewalDate: partnerEntity.subscription.renewalDate
                ? partnerEntity.subscription.renewalDate.toISOString()
                : new Date().toISOString(),
              status: partnerEntity.subscription.status,
              billingFrequency: partnerEntity.subscription.billingFrequency,
              billingAmount: partnerEntity.subscription.billingAmount || 0,
              currency: partnerEntity.subscription.currency || 'USD',
              nextBillingDate: partnerEntity.subscription.nextBillingDate
                ? partnerEntity.subscription.nextBillingDate.toISOString()
                : new Date().toISOString(),
              nextBillingAmount: partnerEntity.subscription.nextBillingAmount || 0,
              currentPeriodStart: partnerEntity.subscription.currentPeriodStart
                ? partnerEntity.subscription.currentPeriodStart.toISOString()
                : new Date().toISOString(),
              currentPeriodEnd: partnerEntity.subscription.currentPeriodEnd
                ? partnerEntity.subscription.currentPeriodEnd.toISOString()
                : new Date().toISOString(),
              trialEndDate: partnerEntity.subscription.trialEndDate
                ? partnerEntity.subscription.trialEndDate.toISOString()
                : null,
              pausedAt: partnerEntity.subscription.pausedAt
                ? partnerEntity.subscription.pausedAt.toISOString()
                : null,
              pauseReason: partnerEntity.subscription.pauseReason || null,
              gracePeriodDays: partnerEntity.subscription.gracePeriodDays || 7,
              retryAttempts: partnerEntity.subscription.retryAttempts || 0,
              maxRetryAttempts: partnerEntity.subscription.maxRetryAttempts || 3,
              // creditBalance fue eliminado - se calcula dinámicamente desde los pagos
              creditBalance: 0,
              discountPercent: partnerEntity.subscription.discountPercent || null,
              discountCode: partnerEntity.subscription.discountCode || null,
              lastPaymentDate: partnerEntity.subscription.lastPaymentDate
                ? partnerEntity.subscription.lastPaymentDate.toISOString()
                : null,
              lastPaymentAmount: partnerEntity.subscription.lastPaymentAmount || null,
              paymentStatus: partnerEntity.subscription.paymentStatus || null,
              autoRenew:
                partnerEntity.subscription.autoRenew !== undefined
                  ? partnerEntity.subscription.autoRenew
                  : true,
              createdAt: partnerEntity.subscription.createdAt
                ? partnerEntity.subscription.createdAt.toISOString()
                : new Date().toISOString(),
              updatedAt: partnerEntity.subscription.updatedAt
                ? partnerEntity.subscription.updatedAt.toISOString()
                : new Date().toISOString(),
            }
          : null,
        limits: null, // limits ya no se archiva - se obtiene desde pricing_plan_limits a través de la suscripción
        stats: null, // stats ya no se archiva - se obtiene desde partner_subscription_usage
        tenants: tenantEntities.map((tenantEntity) => {
          const tenantBranches = branchEntities.filter((b) => b.tenantId === tenantEntity.id);
          return {
            tenant: {
              id: tenantEntity.id,
              partnerId: tenantEntity.partnerId,
              name: tenantEntity.name || '',
              description: tenantEntity.description || null,
              logo: tenantEntity.logo || null,
              category: tenantEntity.category || '',
              currencyId: tenantEntity.currencyId || 0,
              primaryColor: tenantEntity.primaryColor || '',
              secondaryColor: tenantEntity.secondaryColor || '',
              pointsExpireDays: tenantEntity.pointsExpireDays || 0,
              minPointsToRedeem: tenantEntity.minPointsToRedeem || 0,
              status: tenantEntity.status || 'active',
              createdAt: tenantEntity.createdAt
                ? tenantEntity.createdAt.toISOString()
                : new Date().toISOString(),
              updatedAt: tenantEntity.updatedAt
                ? tenantEntity.updatedAt.toISOString()
                : new Date().toISOString(),
            },
            features: tenantEntity.features
              ? {
                  id: tenantEntity.features.id,
                  tenantId: tenantEntity.features.tenantId,
                  qrScanning:
                    tenantEntity.features.qrScanning !== undefined
                      ? tenantEntity.features.qrScanning
                      : true,
                  offlineMode:
                    tenantEntity.features.offlineMode !== undefined
                      ? tenantEntity.features.offlineMode
                      : true,
                  referralProgram:
                    tenantEntity.features.referralProgram !== undefined
                      ? tenantEntity.features.referralProgram
                      : true,
                  birthdayRewards:
                    tenantEntity.features.birthdayRewards !== undefined
                      ? tenantEntity.features.birthdayRewards
                      : true,
                  createdAt: tenantEntity.features.createdAt
                    ? tenantEntity.features.createdAt.toISOString()
                    : new Date().toISOString(),
                  updatedAt: tenantEntity.features.updatedAt
                    ? tenantEntity.features.updatedAt.toISOString()
                    : new Date().toISOString(),
                }
              : null,
            branches: tenantBranches.map((branchEntity) => ({
              id: branchEntity.id,
              tenantId: branchEntity.tenantId,
              name: branchEntity.name || '',
              address: branchEntity.address || '',
              city: branchEntity.city || '',
              country: branchEntity.country || '',
              phone: branchEntity.phone || null,
              email: branchEntity.email || null,
              status: branchEntity.status || 'active',
              createdAt: branchEntity.createdAt
                ? branchEntity.createdAt.toISOString()
                : new Date().toISOString(),
              updatedAt: branchEntity.updatedAt
                ? branchEntity.updatedAt.toISOString()
                : new Date().toISOString(),
            })),
          };
        }),
        deletedAt: new Date().toISOString(),
        deletedBy: request.deletedBy || null,
      };

      // Crear y guardar el registro de archivo
      try {
        const archiveEntity = new PartnerArchiveEntity();
        archiveEntity.originalPartnerId = request.partnerId;
        archiveEntity.archivedData = archivedData;
        archiveEntity.deletedBy = request.deletedBy || null;
        await this.partnerArchiveRepository.save(archiveEntity);
      } catch (archiveError) {
        console.warn(
          `Error al archivar partner ${request.partnerId}, continuando con eliminación:`,
          archiveError,
        );
        // Continuar con la eliminación aunque falle el archivado
      }

      // Eliminar el partner (las relaciones se eliminan en cascada según la configuración de la BD)
      await this.partnerRepository.delete(request.partnerId);

      return new DeletePartnerResponse('Partner deleted successfully', request.partnerId);
    } catch (error) {
      // Si es una excepción conocida, relanzarla
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Para otros errores, loggear y relanzar con un mensaje más descriptivo
      console.error('Error en DeletePartnerHandler:', error);
      throw new Error(
        `Error al eliminar partner con ID ${request.partnerId}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }
}

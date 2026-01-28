import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ITenantRepository, IPartnerRepository } from '@libs/domain';
import { DeleteTenantRequest } from './delete-tenant.request';
import { DeleteTenantResponse } from './delete-tenant.response';
import { SubscriptionUsageHelper } from '@libs/application';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PartnerSubscriptionUsageEntity,
  PartnerSubscriptionEntity,
  TenantEntity,
  BranchEntity,
  CustomerMembershipEntity,
} from '@libs/infrastructure';

/**
 * Handler para el caso de uso de eliminar un tenant
 */
@Injectable()
export class DeleteTenantHandler {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @InjectRepository(PartnerSubscriptionUsageEntity)
    private readonly usageRepository: Repository<PartnerSubscriptionUsageEntity>,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantEntityRepository: Repository<TenantEntity>,
    @InjectRepository(BranchEntity)
    private readonly branchEntityRepository: Repository<BranchEntity>,
    @InjectRepository(CustomerMembershipEntity)
    private readonly customerMembershipRepository: Repository<CustomerMembershipEntity>,
  ) {}

  async execute(request: DeleteTenantRequest): Promise<DeleteTenantResponse> {
    // Verificar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Guardar el partnerId antes de eliminar
    const partnerId = tenant.partnerId;

    // Eliminar el tenant (las características se eliminan en cascada por la relación)
    await this.tenantRepository.delete(request.tenantId);

    // Recalcular subscription usage del partner afectado
    // Usar recálculo completo para asegurar que funcione incluso si no hay suscripción activa
    await SubscriptionUsageHelper.recalculateUsageForPartner(
      partnerId,
      this.subscriptionRepository,
      this.usageRepository,
      this.tenantEntityRepository,
      this.branchEntityRepository,
      this.customerMembershipRepository,
      true, // allowAnyStatus = true para actualizar incluso si la suscripción no está activa
    );

    return new DeleteTenantResponse('Tenant deleted successfully', request.tenantId);
  }
}

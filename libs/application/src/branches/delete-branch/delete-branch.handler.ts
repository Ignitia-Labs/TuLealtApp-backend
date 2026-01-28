import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IBranchRepository, ITenantRepository } from '@libs/domain';
import { DeleteBranchRequest } from './delete-branch.request';
import { DeleteBranchResponse } from './delete-branch.response';
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
 * Handler para el caso de uso de eliminar una branch
 */
@Injectable()
export class DeleteBranchHandler {
  constructor(
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
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

  async execute(request: DeleteBranchRequest): Promise<DeleteBranchResponse> {
    // Verificar que la branch existe
    const branch = await this.branchRepository.findById(request.branchId);

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${request.branchId} not found`);
    }

    // Obtener el tenantId y partnerId antes de eliminar
    const tenantId = branch.tenantId;
    const tenant = await this.tenantRepository.findById(tenantId);
    const partnerId = tenant?.partnerId;

    // Eliminar la branch
    await this.branchRepository.delete(request.branchId);

    // Recalcular subscription usage del partner afectado
    // Usar recálculo completo para asegurar que funcione incluso si no hay suscripción activa
    if (partnerId) {
      await SubscriptionUsageHelper.recalculateUsageForPartner(
        partnerId,
        this.subscriptionRepository,
        this.usageRepository,
        this.tenantEntityRepository,
        this.branchEntityRepository,
        this.customerMembershipRepository,
        true, // allowAnyStatus = true para actualizar incluso si la suscripción no está activa
      );
    }

    return new DeleteBranchResponse('Branch deleted successfully', request.branchId);
  }
}

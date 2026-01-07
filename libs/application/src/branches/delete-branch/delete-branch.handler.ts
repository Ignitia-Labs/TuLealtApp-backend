import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IBranchRepository, ITenantRepository } from '@libs/domain';
import { DeleteBranchRequest } from './delete-branch.request';
import { DeleteBranchResponse } from './delete-branch.response';
import { SubscriptionUsageHelper } from '@libs/application';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerSubscriptionUsageEntity, PartnerSubscriptionEntity } from '@libs/infrastructure';

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
  ) {}

  async execute(request: DeleteBranchRequest): Promise<DeleteBranchResponse> {
    // Verificar que la branch existe
    const branch = await this.branchRepository.findById(request.branchId);

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${request.branchId} not found`);
    }

    // Obtener el tenantId antes de eliminar para obtener el subscriptionId
    const tenantId = branch.tenantId;
    const subscriptionId = await SubscriptionUsageHelper.getSubscriptionIdFromTenantId(
      tenantId,
      this.tenantRepository,
      this.subscriptionRepository,
    );

    // Eliminar la branch
    await this.branchRepository.delete(request.branchId);

    // Decrementar el contador de branches en el uso de suscripción
    if (subscriptionId) {
      await SubscriptionUsageHelper.decrementBranchesCount(subscriptionId, this.usageRepository);
    }

    return new DeleteBranchResponse('Branch deleted successfully', request.branchId);
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ICustomerMembershipRepository } from '@libs/domain';
import { DeleteCustomerMembershipRequest } from './delete-customer-membership.request';
import { DeleteCustomerMembershipResponse } from './delete-customer-membership.response';
import { SubscriptionUsageHelper } from '@libs/application';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PartnerSubscriptionUsageEntity,
  PartnerSubscriptionEntity,
} from '@libs/infrastructure';
import { ITenantRepository } from '@libs/domain';

/**
 * Handler para el caso de uso de eliminar una membership
 */
@Injectable()
export class DeleteCustomerMembershipHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @InjectRepository(PartnerSubscriptionUsageEntity)
    private readonly usageRepository: Repository<PartnerSubscriptionUsageEntity>,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
  ) {}

  async execute(
    request: DeleteCustomerMembershipRequest,
  ): Promise<DeleteCustomerMembershipResponse> {
    // Verificar que la membership existe
    const membership = await this.membershipRepository.findById(request.membershipId);

    if (!membership) {
      throw new NotFoundException(`Membership with ID ${request.membershipId} not found`);
    }

    // Obtener el tenantId antes de eliminar para obtener el subscriptionId
    const tenantId = membership.tenantId;
    const subscriptionId = await SubscriptionUsageHelper.getSubscriptionIdFromTenantId(
      tenantId,
      this.tenantRepository,
      this.subscriptionRepository,
    );

    // Eliminar la membership
    await this.membershipRepository.delete(request.membershipId);

    // Decrementar el contador de customers en el uso de suscripción
    if (subscriptionId) {
      await SubscriptionUsageHelper.decrementCustomersCount(
        subscriptionId,
        this.usageRepository,
      );
    }

    return new DeleteCustomerMembershipResponse(request.membershipId);
  }
}

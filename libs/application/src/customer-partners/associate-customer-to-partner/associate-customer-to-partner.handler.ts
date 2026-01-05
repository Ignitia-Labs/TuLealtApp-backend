import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  ICustomerPartnerRepository,
  IUserRepository,
  IPartnerRepository,
  ITenantRepository,
  IBranchRepository,
  CustomerPartner,
} from '@libs/domain';
import { AssociateCustomerToPartnerRequest } from './associate-customer-to-partner.request';
import { AssociateCustomerToPartnerResponse } from './associate-customer-to-partner.response';

/**
 * Handler para el caso de uso de asociar un customer a un partner
 */
@Injectable()
export class AssociateCustomerToPartnerHandler {
  constructor(
    @Inject('ICustomerPartnerRepository')
    private readonly customerPartnerRepository: ICustomerPartnerRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
  ) {}

  async execute(
    request: AssociateCustomerToPartnerRequest,
  ): Promise<AssociateCustomerToPartnerResponse> {
    // Validar que el usuario existe
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${request.userId} not found`);
    }

    // Validar que el partner existe
    const partner = await this.partnerRepository.findById(request.partnerId);
    if (!partner) {
      throw new NotFoundException(`Partner with ID ${request.partnerId} not found`);
    }

    // Validar que el tenant existe y pertenece al partner
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }
    if (tenant.partnerId !== request.partnerId) {
      throw new BadRequestException(
        `Tenant ${request.tenantId} does not belong to partner ${request.partnerId}`,
      );
    }

    // Validar que la branch existe y pertenece al tenant
    const branch = await this.branchRepository.findById(request.registrationBranchId);
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${request.registrationBranchId} not found`);
    }
    if (branch.tenantId !== request.tenantId) {
      throw new BadRequestException(
        `Branch ${request.registrationBranchId} does not belong to tenant ${request.tenantId}`,
      );
    }

    // Validar que no existe ya una asociación para ese usuario+partner+tenant
    const existingAssociation =
      await this.customerPartnerRepository.findByUserIdAndPartnerIdAndTenantId(
        request.userId,
        request.partnerId,
        request.tenantId,
      );
    if (existingAssociation) {
      throw new ConflictException(
        `Association already exists for user ${request.userId}, partner ${request.partnerId} and tenant ${request.tenantId}`,
      );
    }

    // Crear la asociación
    const customerPartner = CustomerPartner.create(
      request.userId,
      request.partnerId,
      request.tenantId,
      request.registrationBranchId,
      request.metadata || null,
    );

    // Guardar la asociación
    const savedAssociation = await this.customerPartnerRepository.save(customerPartner);

    // Retornar response DTO
    return new AssociateCustomerToPartnerResponse(
      savedAssociation.id,
      savedAssociation.userId,
      savedAssociation.partnerId,
      savedAssociation.tenantId,
      savedAssociation.registrationBranchId,
      savedAssociation.status,
      savedAssociation.joinedDate,
      savedAssociation.lastActivityDate,
      savedAssociation.metadata,
      savedAssociation.createdAt,
      savedAssociation.updatedAt,
    );
  }
}

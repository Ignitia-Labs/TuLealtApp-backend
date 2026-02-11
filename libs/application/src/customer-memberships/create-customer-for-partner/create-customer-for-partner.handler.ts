import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  IUserRepository,
  ITenantRepository,
  IBranchRepository,
  ICustomerTierRepository,
  CustomerMembership,
} from '@libs/domain';
import { generateMembershipQrCode } from '@libs/shared';
import { CreateUserHandler } from '../../users/create-user/create-user.handler';
import { CreateUserRequest } from '../../users/create-user/create-user.request';
import { CreateCustomerMembershipRequest } from '../create-customer-membership/create-customer-membership.request';
import { CreateCustomerMembershipResponse } from '../create-customer-membership/create-customer-membership.response';
import { CustomerMembershipDto } from '../dto/customer-membership.dto';
import { GetCustomerMembershipsHandler } from '../get-customer-memberships/get-customer-memberships.handler';
import { CreateCustomerForPartnerRequest } from './create-customer-for-partner.request';
import { CreateCustomerForPartnerResponse } from './create-customer-for-partner.response';
import { SubscriptionUsageHelper } from '@libs/application';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerSubscriptionUsageEntity, PartnerSubscriptionEntity } from '@libs/infrastructure';

/**
 * Handler para crear un customer completo (usuario + membership) desde Partner API
 * Valida que el tenant pertenezca al partner del usuario autenticado
 */
@Injectable()
export class CreateCustomerForPartnerHandler {
  constructor(
    private readonly createUserHandler: CreateUserHandler,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
    @Inject('ICustomerTierRepository')
    private readonly tierRepository: ICustomerTierRepository,
    @InjectRepository(PartnerSubscriptionUsageEntity)
    private readonly usageRepository: Repository<PartnerSubscriptionUsageEntity>,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
  ) {}

  async execute(
    request: CreateCustomerForPartnerRequest,
    partnerId: number,
  ): Promise<CreateCustomerForPartnerResponse> {
    // Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Validar que el tenant pertenece al partner del usuario autenticado
    if (tenant.partnerId !== partnerId) {
      throw new ForbiddenException(`Tenant ${request.tenantId} does not belong to your partner`);
    }

    // Validar branch solo si se proporciona
    if (request.registrationBranchId) {
      const branch = await this.branchRepository.findById(request.registrationBranchId);
      if (!branch) {
        throw new NotFoundException(`Branch with ID ${request.registrationBranchId} not found`);
      }
      if (branch.tenantId !== request.tenantId) {
        throw new BadRequestException(
          `Branch ${request.registrationBranchId} does not belong to tenant ${request.tenantId}`,
        );
      }
    }

    // Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      // Si el usuario ya existe, crear solo la membership
      const createMembershipRequest = new CreateCustomerMembershipRequest();
      createMembershipRequest.userId = existingUser.id;
      createMembershipRequest.tenantId = request.tenantId;
      createMembershipRequest.registrationBranchId = request.registrationBranchId;
      createMembershipRequest.points = request.points || 0;
      createMembershipRequest.status = request.status || 'active';

      // Validar que no existe ya una membership para ese usuario+tenant
      const existingMembership = await this.membershipRepository.findByUserIdAndTenantId(
        existingUser.id,
        request.tenantId,
      );
      if (existingMembership) {
        throw new ConflictException(
          `Membership already exists for user ${existingUser.id} and tenant ${request.tenantId}`,
        );
      }

      // Crear la membership usando el handler existente
      const membershipResult = await this.createMembership(createMembershipRequest, partnerId);

      return new CreateCustomerForPartnerResponse(
        existingUser.id,
        existingUser.email,
        existingUser.name,
        existingUser.createdAt,
        membershipResult.membership,
        false, // usuarioExistente = true
      );
    }

    // Crear el usuario
    const createUserRequest = new CreateUserRequest();
    createUserRequest.email = request.email;
    createUserRequest.name = request.name;
    createUserRequest.firstName = request.firstName;
    createUserRequest.lastName = request.lastName;
    createUserRequest.phone = request.phone;
    createUserRequest.password = request.password;
    createUserRequest.roles = ['CUSTOMER'];

    const userResult = await this.createUserHandler.execute(createUserRequest);

    // Crear la membership automáticamente
    const createMembershipRequest = new CreateCustomerMembershipRequest();
    createMembershipRequest.userId = userResult.id;
    createMembershipRequest.tenantId = request.tenantId;
    createMembershipRequest.registrationBranchId = request.registrationBranchId;
    createMembershipRequest.points = request.points || 0;
    createMembershipRequest.status = request.status || 'active';

    const membershipResult = await this.createMembership(createMembershipRequest, partnerId);

    return new CreateCustomerForPartnerResponse(
      userResult.id,
      userResult.email,
      userResult.name,
      userResult.createdAt,
      membershipResult.membership,
      true, // usuarioCreado = true
    );
  }

  /**
   * Método privado para crear la membership
   */
  private async createMembership(
    request: CreateCustomerMembershipRequest,
    partnerId: number,
  ): Promise<CreateCustomerMembershipResponse> {
    // Validar que el usuario existe
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${request.userId} not found`);
    }

    // Validar que el tenant existe y pertenece al partner
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }
    if (tenant.partnerId !== partnerId) {
      throw new ForbiddenException(`Tenant ${request.tenantId} does not belong to your partner`);
    }

    // Validar branch solo si se proporciona
    if (request.registrationBranchId) {
      const branch = await this.branchRepository.findById(request.registrationBranchId);
      if (!branch) {
        throw new NotFoundException(`Branch with ID ${request.registrationBranchId} not found`);
      }
      if (branch.tenantId !== request.tenantId) {
        throw new BadRequestException(
          `Branch ${request.registrationBranchId} does not belong to tenant ${request.tenantId}`,
        );
      }
    }

    // Validar que no existe ya una membership para ese usuario+tenant
    const existingMembership = await this.membershipRepository.findByUserIdAndTenantId(
      request.userId,
      request.tenantId,
    );
    if (existingMembership) {
      throw new ConflictException(
        `Membership already exists for user ${request.userId} and tenant ${request.tenantId}`,
      );
    }

    // Generar QR code único
    const qrCode = await this.generateUniqueQrCode(request.userId, request.tenantId);

    // Calcular tier basándose en los puntos iniciales
    const initialPoints = request.points || 0;
    const tier = await this.tierRepository.findByPoints(request.tenantId, initialPoints);
    const tierId = tier ? tier.id : null;

    // Crear la membership
    const membership = CustomerMembership.create(
      request.userId,
      request.tenantId,
      request.registrationBranchId || null,
      initialPoints,
      tierId,
      0, // totalSpent inicial
      0, // totalVisits inicial
      null, // lastVisit inicial
      new Date(), // joinedDate = ahora
      qrCode,
      request.status || 'active',
    );

    // Guardar la membership
    const savedMembership = await this.membershipRepository.save(membership);

    // Incrementar el contador de customers en el uso de suscripción
    const subscriptionId = await SubscriptionUsageHelper.getSubscriptionIdFromTenantId(
      savedMembership.tenantId,
      this.tenantRepository,
      this.subscriptionRepository,
    );
    if (subscriptionId) {
      await SubscriptionUsageHelper.incrementCustomersCount(subscriptionId, this.usageRepository);
    }

    // Convertir a DTO con información denormalizada
    const membershipDto = await this.toDto(savedMembership);

    return new CreateCustomerMembershipResponse(membershipDto);
  }

  /**
   * Genera un QR code único para la membership
   */
  private async generateUniqueQrCode(userId: number, tenantId: number): Promise<string> {
    let qrCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      qrCode = generateMembershipQrCode({ userId, tenantId });
      attempts++;

      const existing = await this.membershipRepository.findByQrCode(qrCode);
      if (!existing) {
        return qrCode;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique QR code after multiple attempts');
      }
    } while (true);
  }

  /**
   * Convierte una entidad CustomerMembership a DTO con información denormalizada
   */
  private async toDto(membership: CustomerMembership): Promise<any> {
    const tenant = await this.tenantRepository.findById(membership.tenantId);
    if (!tenant) {
      throw new Error(`Tenant with ID ${membership.tenantId} not found`);
    }

    let branchName: string | null = null;
    if (membership.registrationBranchId) {
      const branch = await this.branchRepository.findById(membership.registrationBranchId);
      if (branch) {
        branchName = branch.name;
      }
    }

    let tierName: string | null = null;
    let tierColor: string | null = null;
    if (membership.tierId) {
      const tier = await this.tierRepository.findById(membership.tierId);
      if (tier) {
        tierName = tier.name;
        tierColor = tier.color;
      }
    }

    const availableRewards = 0;

    return GetCustomerMembershipsHandler.createDtoWithoutTierData(
      membership,
      tenant,
      branchName,
      tierName,
      tierColor,
      availableRewards,
    );
  }
}

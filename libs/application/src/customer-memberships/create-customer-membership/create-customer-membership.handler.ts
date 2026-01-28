import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
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
import { CreateCustomerMembershipRequest } from './create-customer-membership.request';
import { CreateCustomerMembershipResponse } from './create-customer-membership.response';
import { CustomerMembershipDto } from '../dto/customer-membership.dto';
import { SubscriptionUsageHelper } from '@libs/application';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerSubscriptionUsageEntity, PartnerSubscriptionEntity } from '@libs/infrastructure';

/**
 * Handler para el caso de uso de crear una membership
 */
@Injectable()
export class CreateCustomerMembershipHandler {
  constructor(
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
    request: CreateCustomerMembershipRequest,
  ): Promise<CreateCustomerMembershipResponse> {
    // Validar que el usuario existe
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${request.userId} not found`);
    }

    // Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
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
    console.log(
      `[CreateCustomerMembershipHandler] Attempting to update subscription usage for tenantId ${savedMembership.tenantId}, membershipId ${savedMembership.id}`,
    );

    const subscriptionId = await SubscriptionUsageHelper.getSubscriptionIdFromTenantId(
      savedMembership.tenantId,
      this.tenantRepository,
      this.subscriptionRepository,
    );

    if (subscriptionId) {
      console.log(
        `[CreateCustomerMembershipHandler] Found subscription ${subscriptionId} for tenantId ${savedMembership.tenantId}. Incrementing customers count...`,
      );
      try {
        await SubscriptionUsageHelper.incrementCustomersCount(subscriptionId, this.usageRepository);
        console.log(
          `[CreateCustomerMembershipHandler] ✓ Successfully incremented customers count for subscription ${subscriptionId} (tenantId: ${savedMembership.tenantId}, membershipId: ${savedMembership.id})`,
        );
      } catch (error) {
        console.error(
          `[CreateCustomerMembershipHandler] ✗ Error incrementing customers count for subscription ${subscriptionId}:`,
          error,
        );
        // No lanzar error para no interrumpir la creación de la membership
        // pero registrar el error para debugging
      }
    } else {
      console.warn(
        `[CreateCustomerMembershipHandler] ⚠ Could not find subscription for tenantId ${savedMembership.tenantId}. Subscription usage not updated.`,
      );
    }

    // Convertir a DTO con información denormalizada
    const membershipDto = await this.toDto(savedMembership);

    return new CreateCustomerMembershipResponse(membershipDto);
  }

  /**
   * Genera un QR code único para la membership
   * Utiliza el servicio utilitario y verifica unicidad en la base de datos
   */
  private async generateUniqueQrCode(userId: number, tenantId: number): Promise<string> {
    let qrCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      // Generar QR code usando el servicio utilitario
      qrCode = generateMembershipQrCode({ userId, tenantId });
      attempts++;

      // Verificar que el QR code sea único
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
  private async toDto(membership: CustomerMembership): Promise<CustomerMembershipDto> {
    // Obtener información del tenant
    const tenant = await this.tenantRepository.findById(membership.tenantId);
    if (!tenant) {
      throw new Error(`Tenant with ID ${membership.tenantId} not found`);
    }

    // Obtener información de la branch de registro (si existe)
    let branchName: string | null = null;
    if (membership.registrationBranchId) {
      const branch = await this.branchRepository.findById(membership.registrationBranchId);
      if (!branch) {
        throw new Error(`Branch with ID ${membership.registrationBranchId} not found`);
      }
      branchName = branch.name;
    }

    // Obtener información del tier si existe
    let tierName: string | null = null;
    let tierColor: string | null = null;
    if (membership.tierId) {
      const tier = await this.tierRepository.findById(membership.tierId);
      if (tier) {
        tierName = tier.name;
        tierColor = tier.color;
      }
    }

    // Calcular availableRewards (por ahora retornamos 0, se puede implementar lógica más adelante)
    const availableRewards = 0;

    return new CustomerMembershipDto(
      membership.id,
      membership.userId,
      membership.tenantId,
      tenant.name,
      tenant.logo,
      tenant.logo, // tenantImage puede ser igual a logo
      tenant.category,
      tenant.primaryColor,
      membership.registrationBranchId,
      branchName,
      membership.points,
      membership.tierId,
      tierName,
      tierColor,
      membership.totalSpent,
      membership.totalVisits,
      membership.lastVisit,
      membership.joinedDate,
      availableRewards,
      membership.qrCode,
      membership.status,
      membership.createdAt,
      membership.updatedAt,
    );
  }
}

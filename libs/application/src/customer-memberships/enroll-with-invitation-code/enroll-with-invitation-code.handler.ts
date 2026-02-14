import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  IInvitationCodeRepository,
  ILoyaltyProgramRepository,
  IEnrollmentRepository,
  ITenantRepository,
  IBranchRepository,
  ICustomerTierRepository,
  IUserRepository,
  CustomerMembership,
  Enrollment,
} from '@libs/domain';
import { generateMembershipQrCode } from '@libs/shared';
import { EnrollWithInvitationCodeRequest } from './enroll-with-invitation-code.request';
import {
  EnrollWithInvitationCodeResponse,
  EnrollmentInfoDto,
} from './enroll-with-invitation-code.response';
import { CustomerMembershipDto } from '../dto/customer-membership.dto';
import { GetCustomerMembershipsHandler } from '../get-customer-memberships/get-customer-memberships.handler';
import { SubscriptionUsageHelper } from '@libs/application';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerSubscriptionUsageEntity, PartnerSubscriptionEntity } from '@libs/infrastructure';

/**
 * Handler para el caso de uso de inscripción con código de invitación
 * - Valida el invitation code
 * - Crea membership en el tenant del código (si no existe)
 * - Inscribe automáticamente al programa BASE activo del tenant
 * - Incrementa el uso del invitation code
 */
@Injectable()
export class EnrollWithInvitationCodeHandler {
  constructor(
    @Inject('IInvitationCodeRepository')
    private readonly invitationCodeRepository: IInvitationCodeRepository,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    @Inject('IEnrollmentRepository')
    private readonly enrollmentRepository: IEnrollmentRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
    @Inject('ICustomerTierRepository')
    private readonly tierRepository: ICustomerTierRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @InjectRepository(PartnerSubscriptionUsageEntity)
    private readonly usageRepository: Repository<PartnerSubscriptionUsageEntity>,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
  ) {}

  async execute(
    request: EnrollWithInvitationCodeRequest,
    userId: number,
  ): Promise<EnrollWithInvitationCodeResponse> {
    // 1. Validar que el usuario existe
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 2. Buscar y validar el invitation code
    const invitationCode = await this.invitationCodeRepository.findByCode(request.invitationCode);

    if (!invitationCode) {
      throw new NotFoundException(`Invitation code "${request.invitationCode}" not found`);
    }

    if (!invitationCode.isValid()) {
      throw new BadRequestException(
        `Invitation code "${request.invitationCode}" is not valid (expired, disabled, or limit reached)`,
      );
    }

    // 3. Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(invitationCode.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${invitationCode.tenantId} not found`);
    }

    // 4. Buscar o crear membership
    let membership = await this.membershipRepository.findByUserIdAndTenantId(
      userId,
      invitationCode.tenantId,
    );

    let membershipCreated = false;

    if (!membership) {
      // Crear nueva membership
      membership = await this.createMembership(
        userId,
        invitationCode.tenantId,
        invitationCode.branchId,
      );
      membershipCreated = true;
    }

    // 5. Buscar programa BASE activo del tenant
    const baseProgram = await this.programRepository.findBaseProgramByTenantId(
      invitationCode.tenantId,
    );

    if (!baseProgram) {
      throw new NotFoundException(
        `No active BASE program found for tenant ${invitationCode.tenantId}`,
      );
    }

    if (!baseProgram.isActive()) {
      throw new BadRequestException(
        `BASE program ${baseProgram.id} for tenant ${invitationCode.tenantId} is not active`,
      );
    }

    // 6. Verificar si ya está enrollado en el programa BASE
    let enrollment = await this.enrollmentRepository.findByMembershipIdAndProgramId(
      membership.id,
      baseProgram.id,
    );

    if (enrollment && enrollment.isActive()) {
      throw new ConflictException(
        `Membership ${membership.id} is already enrolled in BASE program ${baseProgram.id}`,
      );
    }

    // 7. Crear enrollment en programa BASE si no existe
    if (!enrollment) {
      enrollment = Enrollment.create(
        membership.id,
        baseProgram.id,
        new Date(), // effectiveFrom
        null, // effectiveTo
        null, // metadata
        'ACTIVE',
      );

      enrollment = await this.enrollmentRepository.save(enrollment);

      console.log(
        `[EnrollWithInvitationCodeHandler] ✓ Successfully enrolled membership ${membership.id} (user ${userId}) in BASE program ${baseProgram.id} (tenant ${invitationCode.tenantId}) using invitation code ${invitationCode.code}`,
      );
    }

    // 8. Incrementar el uso del invitation code
    const updatedCode = invitationCode.incrementUses();
    await this.invitationCodeRepository.update(updatedCode);

    console.log(
      `[EnrollWithInvitationCodeHandler] ✓ Invitation code ${invitationCode.code} used. Current uses: ${updatedCode.currentUses}/${updatedCode.maxUses || 'unlimited'}`,
    );

    // 9. Convertir membership a DTO
    const membershipDto = await this.toDto(membership);

    // 10. Crear EnrollmentInfoDto
    const enrollmentInfo = new EnrollmentInfoDto(
      enrollment.id,
      baseProgram.id,
      baseProgram.name,
      enrollment.status,
      enrollment.createdAt,
    );

    return new EnrollWithInvitationCodeResponse(membershipDto, enrollmentInfo, membershipCreated);
  }

  /**
   * Crea una nueva membership para el usuario en el tenant
   */
  private async createMembership(
    userId: number,
    tenantId: number,
    branchId: number | null,
  ): Promise<CustomerMembership> {
    // Validar branch si se proporciona
    if (branchId) {
      const branch = await this.branchRepository.findById(branchId);
      if (!branch) {
        throw new NotFoundException(`Branch with ID ${branchId} not found`);
      }
      if (branch.tenantId !== tenantId) {
        throw new BadRequestException(`Branch ${branchId} does not belong to tenant ${tenantId}`);
      }
    }

    // Generar QR code único
    const qrCode = await this.generateUniqueQrCode(userId, tenantId);

    // Calcular tier basándose en puntos iniciales (0)
    const tier = await this.tierRepository.findByPoints(tenantId, 0);
    const tierId = tier ? tier.id : null;

    // Crear la membership
    const membership = CustomerMembership.create(
      userId,
      tenantId,
      branchId,
      0, // points inicial
      tierId,
      0, // totalSpent inicial
      0, // totalVisits inicial
      null, // lastVisit inicial
      new Date(), // joinedDate = ahora
      qrCode,
      'active',
    );

    // Guardar la membership
    const savedMembership = await this.membershipRepository.save(membership);

    // Incrementar el contador de customers en el uso de suscripción
    console.log(
      `[EnrollWithInvitationCodeHandler] Attempting to update subscription usage for tenantId ${savedMembership.tenantId}, membershipId ${savedMembership.id}`,
    );

    const subscriptionId = await SubscriptionUsageHelper.getSubscriptionIdFromTenantId(
      savedMembership.tenantId,
      this.tenantRepository,
      this.subscriptionRepository,
    );

    if (subscriptionId) {
      console.log(
        `[EnrollWithInvitationCodeHandler] Found subscription ${subscriptionId} for tenantId ${savedMembership.tenantId}. Incrementing customers count...`,
      );
      try {
        await SubscriptionUsageHelper.incrementCustomersCount(subscriptionId, this.usageRepository);
        console.log(
          `[EnrollWithInvitationCodeHandler] ✓ Successfully incremented customers count for subscription ${subscriptionId} (tenantId: ${savedMembership.tenantId}, membershipId: ${savedMembership.id})`,
        );
      } catch (error) {
        console.error(
          `[EnrollWithInvitationCodeHandler] ✗ Error incrementing customers count for subscription ${subscriptionId}:`,
          error,
        );
      }
    } else {
      console.warn(
        `[EnrollWithInvitationCodeHandler] ⚠ Could not find subscription for tenantId ${savedMembership.tenantId}. Subscription usage not updated.`,
      );
    }

    return savedMembership;
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
  private async toDto(membership: CustomerMembership): Promise<CustomerMembershipDto> {
    const tenant = await this.tenantRepository.findById(membership.tenantId);
    if (!tenant) {
      throw new Error(`Tenant with ID ${membership.tenantId} not found`);
    }

    let branchName: string | null = null;
    if (membership.registrationBranchId) {
      const branch = await this.branchRepository.findById(membership.registrationBranchId);
      if (!branch) {
        throw new Error(`Branch with ID ${membership.registrationBranchId} not found`);
      }
      branchName = branch.name;
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

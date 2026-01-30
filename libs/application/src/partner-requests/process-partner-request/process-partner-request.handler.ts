import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, In } from 'typeorm';
import {
  IPartnerRequestRepository,
  IPartnerRepository,
  ISubscriptionEventRepository,
  ICountryRepository,
  IUserRepository,
  IPricingPlanRepository,
  SubscriptionEvent,
  Tenant,
  TenantFeatures,
  Branch,
  User,
} from '@libs/domain';
import {
  PartnerSubscriptionEntity,
  PartnerEntity,
  PartnerSubscriptionUsageEntity,
  TenantEntity,
  TenantFeaturesEntity,
  BranchEntity,
  UserEntity,
  TenantMapper,
  BranchMapper,
  UserMapper,
} from '@libs/infrastructure';
import {
  generateColorsFromString,
  generateRandomPassword,
  extractFirstNameAndLastName,
  generateTenantQuickSearchCode,
  generateBranchQuickSearchCode,
} from '@libs/shared';
import * as bcrypt from 'bcrypt';
import { CreatePartnerHandler } from '../../partners/create-partner/create-partner.handler';
import { CreatePartnerRequest } from '../../partners/create-partner/create-partner.request';
import { ProcessPartnerRequestRequest } from './process-partner-request.request';
import { ProcessPartnerRequestResponse } from './process-partner-request.response';

/**
 * Handler para el caso de uso de procesar una solicitud de partner (convertirla en partner)
 */
@Injectable()
export class ProcessPartnerRequestHandler {
  constructor(
    @Inject('IPartnerRequestRepository')
    private readonly partnerRequestRepository: IPartnerRequestRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('ISubscriptionEventRepository')
    private readonly subscriptionEventRepository: ISubscriptionEventRepository,
    @Inject('ICountryRepository')
    private readonly countryRepository: ICountryRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPricingPlanRepository')
    private readonly pricingPlanRepository: IPricingPlanRepository,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly createPartnerHandler: CreatePartnerHandler,
  ) {}

  async execute(request: ProcessPartnerRequestRequest): Promise<ProcessPartnerRequestResponse> {
    // Obtener la solicitud
    const partnerRequest = await this.partnerRequestRepository.findById(request.requestId);

    if (!partnerRequest) {
      throw new NotFoundException(`Partner request with ID ${request.requestId} not found`);
    }

    if (partnerRequest.status === 'enrolled') {
      throw new BadRequestException('La solicitud ya ha sido procesada');
    }

    if (partnerRequest.status === 'rejected') {
      throw new BadRequestException('No se puede procesar una solicitud rechazada');
    }

    // Validar que fiscalAddress no sea null (necesario para crear branch)
    if (!partnerRequest.fiscalAddress) {
      throw new BadRequestException(
        'La dirección fiscal es requerida para crear la sucursal principal',
      );
    }

    // Validar que countryId no sea null (necesario para crear branch)
    if (!partnerRequest.countryId) {
      throw new BadRequestException('El país es requerido para crear la sucursal principal');
    }

    // Si se proporciona trialDays en el request, actualizar la solicitud antes de procesar
    let updatedPartnerRequest = partnerRequest;
    if (request.trialDays !== undefined && request.trialDays !== null) {
      // Actualizar trialDays en la solicitud
      updatedPartnerRequest = partnerRequest.updateTrialDays(request.trialDays, null);
      await this.partnerRequestRepository.update(updatedPartnerRequest);
    }

    // Usar directamente el countryId del partnerRequest
    const countryId = updatedPartnerRequest.countryId;

    // Generar dominio si no se proporciona
    const domain =
      request.domain ||
      updatedPartnerRequest.email.split('@')[1] ||
      `${updatedPartnerRequest.name.toLowerCase().replace(/\s+/g, '-')}.gt`;

    // Validar que el dominio no exista
    const existingPartnerByDomain = await this.partnerRepository.findByDomain(domain);
    if (existingPartnerByDomain) {
      throw new BadRequestException(`Ya existe un partner con el dominio: ${domain}`);
    }

    // Obtener trialDays: usar el del request si se proporciona, sino el de la solicitud actualizada
    const trialDaysToUse =
      request.trialDays !== undefined && request.trialDays !== null
        ? request.trialDays
        : updatedPartnerRequest.trialDays;

    // Crear el DTO para crear el partner
    const createPartnerRequest = new CreatePartnerRequest();
    createPartnerRequest.name = updatedPartnerRequest.name;
    createPartnerRequest.responsibleName = updatedPartnerRequest.responsibleName;
    createPartnerRequest.email = updatedPartnerRequest.email;
    createPartnerRequest.phone = updatedPartnerRequest.phone;
    createPartnerRequest.countryId = countryId;
    createPartnerRequest.city = updatedPartnerRequest.city;
    createPartnerRequest.plan = updatedPartnerRequest.plan;
    createPartnerRequest.logo = updatedPartnerRequest.logo;
    createPartnerRequest.category = updatedPartnerRequest.category;
    createPartnerRequest.branchesNumber = updatedPartnerRequest.branchesNumber;
    createPartnerRequest.website = updatedPartnerRequest.website;
    createPartnerRequest.socialMedia = updatedPartnerRequest.socialMedia;
    // currencyId es number tanto en dominio como en request
    createPartnerRequest.currencyId = updatedPartnerRequest.currencyId;
    createPartnerRequest.businessName = updatedPartnerRequest.businessName;
    createPartnerRequest.taxId = updatedPartnerRequest.taxId;
    createPartnerRequest.fiscalAddress = updatedPartnerRequest.fiscalAddress;
    createPartnerRequest.paymentMethod = updatedPartnerRequest.paymentMethod;
    createPartnerRequest.billingEmail = updatedPartnerRequest.billingEmail;
    createPartnerRequest.domain = domain;
    createPartnerRequest.subscriptionTrialDays = trialDaysToUse;

    // Usar planId del partnerRequest si está disponible, sino usar el del request o generar uno basado en el plan
    // subscriptionPlanId debe ser un string (puede ser el ID convertido a string o un slug)
    createPartnerRequest.subscriptionPlanId =
      request.subscriptionPlanId ||
      (updatedPartnerRequest.planId
        ? `plan-${updatedPartnerRequest.planId}`
        : `plan-${updatedPartnerRequest.plan}`);

    createPartnerRequest.subscriptionStartDate =
      request.subscriptionStartDate || new Date().toISOString();
    createPartnerRequest.subscriptionRenewalDate =
      request.subscriptionRenewalDate ||
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 año desde ahora
    createPartnerRequest.subscriptionLastPaymentAmount = request.subscriptionLastPaymentAmount || 0;
    createPartnerRequest.subscriptionAutoRenew =
      request.subscriptionAutoRenew !== undefined ? request.subscriptionAutoRenew : true;
    // Usar billingFrequency del partnerRequest si está disponible, sino usar el del request o 'monthly' por defecto
    createPartnerRequest.subscriptionBillingFrequency =
      request.subscriptionBillingFrequency || updatedPartnerRequest.billingFrequency || 'monthly';

    // Usar subscriptionCurrencyId del partnerRequest si está disponible, sino usar el currencyId del partnerRequest
    // Si se proporciona en el request, tiene prioridad
    createPartnerRequest.subscriptionCurrencyId =
      request.subscriptionCurrencyId ??
      updatedPartnerRequest.subscriptionCurrencyId ??
      updatedPartnerRequest.currencyId;

    // Configurar valores de IVA (si se proporcionan en el request, usarlos; sino usar valores por defecto)
    createPartnerRequest.subscriptionIncludeTax = request.subscriptionIncludeTax ?? false;
    createPartnerRequest.subscriptionTaxPercent = request.subscriptionTaxPercent ?? null;

    // Si se proporcionan valores directos de precio, usarlos
    if (request.subscriptionBasePrice !== undefined) {
      createPartnerRequest.subscriptionBasePrice = request.subscriptionBasePrice;
    }
    if (request.subscriptionTaxAmount !== undefined) {
      createPartnerRequest.subscriptionTaxAmount = request.subscriptionTaxAmount;
    }
    if (request.subscriptionTotalPrice !== undefined) {
      createPartnerRequest.subscriptionTotalPrice = request.subscriptionTotalPrice;
    }

    // Obtener límites del plan de precios como referencia
    let planLimits: {
      maxTenants: number;
      maxBranches: number;
      maxCustomers: number;
      maxRewards: number;
      maxAdmins: number;
      storageGB: number;
      apiCallsPerMonth: number;
      maxLoyaltyPrograms: number;
      maxLoyaltyProgramsBase: number;
      maxLoyaltyProgramsPromo: number;
      maxLoyaltyProgramsPartner: number;
      maxLoyaltyProgramsSubscription: number;
      maxLoyaltyProgramsExperimental: number;
    } | null = null;

    // Intentar obtener los límites del plan si existe planId
    if (updatedPartnerRequest.planId) {
      const pricingPlan = await this.pricingPlanRepository.findById(updatedPartnerRequest.planId);
      if (pricingPlan && pricingPlan.limits) {
        planLimits = {
          maxTenants: pricingPlan.limits.maxTenants,
          maxBranches: pricingPlan.limits.maxBranches,
          maxCustomers: pricingPlan.limits.maxCustomers,
          maxRewards: pricingPlan.limits.maxRewards,
          maxAdmins: pricingPlan.limits.maxAdmins,
          storageGB: pricingPlan.limits.storageGB,
          apiCallsPerMonth: pricingPlan.limits.apiCallsPerMonth,
          maxLoyaltyPrograms: pricingPlan.limits.maxLoyaltyPrograms,
          maxLoyaltyProgramsBase: pricingPlan.limits.maxLoyaltyProgramsBase,
          maxLoyaltyProgramsPromo: pricingPlan.limits.maxLoyaltyProgramsPromo,
          maxLoyaltyProgramsPartner: pricingPlan.limits.maxLoyaltyProgramsPartner,
          maxLoyaltyProgramsSubscription: pricingPlan.limits.maxLoyaltyProgramsSubscription,
          maxLoyaltyProgramsExperimental: pricingPlan.limits.maxLoyaltyProgramsExperimental,
        };
      }
    }

    // Usar límites del plan como referencia, pero permitir sobrescribir con valores del request
    // Si no hay plan o no tiene límites, usar valores por defecto
    createPartnerRequest.limitsMaxTenants = request.limitsMaxTenants ?? planLimits?.maxTenants ?? 5;
    createPartnerRequest.limitsMaxBranches =
      request.limitsMaxBranches ?? planLimits?.maxBranches ?? 20;
    createPartnerRequest.limitsMaxCustomers =
      request.limitsMaxCustomers ?? planLimits?.maxCustomers ?? 5000;
    createPartnerRequest.limitsMaxRewards =
      request.limitsMaxRewards ?? planLimits?.maxRewards ?? 50;
    createPartnerRequest.limitsMaxAdmins = request.limitsMaxAdmins ?? planLimits?.maxAdmins ?? -1;
    createPartnerRequest.limitsStorageGB = request.limitsStorageGB ?? planLimits?.storageGB ?? -1;
    createPartnerRequest.limitsApiCallsPerMonth =
      request.limitsApiCallsPerMonth ?? planLimits?.apiCallsPerMonth ?? -1;

    // Los límites de loyalty programs se transferirán automáticamente desde el plan en CreatePartnerHandler
    // No se exponen en el request para simplificar, se toman directamente del plan

    // Envolver toda la lógica en una transacción para garantizar atomicidad
    return await this.dataSource.transaction(async (manager) => {
      // Crear el partner
      const createPartnerResponse = await this.createPartnerHandler.execute(createPartnerRequest);

      // Obtener la suscripción creada para el partner usando manager
      const subscriptionEntity = await manager.findOne(PartnerSubscriptionEntity, {
        where: { partnerId: createPartnerResponse.id },
        order: { createdAt: 'DESC' },
      });

      // Registrar evento de creación de suscripción si existe
      if (subscriptionEntity) {
        const subscriptionEvent = SubscriptionEvent.create(
          subscriptionEntity.id,
          createPartnerResponse.id,
          'created',
          'Suscripción creada',
          `Suscripción creada para el partner ${createPartnerResponse.name} con plan ${createPartnerRequest.subscriptionPlanId}`,
          new Date(),
          null, // paymentId
          null, // invoiceId
          {
            partnerRequestId: partnerRequest.id,
            planId: createPartnerRequest.subscriptionPlanId,
            planType: partnerRequest.plan,
            billingFrequency: createPartnerRequest.subscriptionBillingFrequency || 'monthly',
            billingAmount: createPartnerRequest.subscriptionLastPaymentAmount || 0,
          },
        );

        await this.subscriptionEventRepository.save(subscriptionEvent);
      }

      // Generar colores desde el nombre del partner
      const colors = generateColorsFromString(updatedPartnerRequest.name);

      // Obtener nombre del país
      const country = await this.countryRepository.findById(updatedPartnerRequest.countryId!);
      if (!country) {
        throw new NotFoundException(`Country with ID ${updatedPartnerRequest.countryId} not found`);
      }

      // Crear tenant automáticamente
      const tenantEntity = await this.createTenantWithManager(
        manager,
        createPartnerResponse.id,
        updatedPartnerRequest,
        colors,
      );

      // Crear branch automáticamente
      const branchEntity = await this.createBranchWithManager(
        manager,
        tenantEntity.id,
        updatedPartnerRequest,
        country.name,
      );

      // Crear usuario partner automáticamente
      const { user: createdUser, temporaryPassword } = await this.createPartnerUserWithManager(
        manager,
        createPartnerResponse.id,
        updatedPartnerRequest,
      );

      // Marcar la solicitud como enrolled usando manager si es necesario
      // Nota: El repositorio puede usar su propia conexión, pero como estamos en transacción,
      // TypeORM debería manejar esto correctamente
      const enrolledRequest = updatedPartnerRequest.markEnrolled();
      await this.partnerRequestRepository.update(enrolledRequest);

      return new ProcessPartnerRequestResponse(
        createPartnerResponse.id,
        updatedPartnerRequest.id,
        'enrolled',
        createPartnerResponse.name,
        createPartnerResponse.email,
        createPartnerResponse.domain,
        tenantEntity.quickSearchCode,
        branchEntity.quickSearchCode,
        tenantEntity.id,
        branchEntity.id,
        createdUser.id,
        createdUser.email,
        createdUser.name,
        temporaryPassword,
      );
    });
  }

  /**
   * Crea un tenant usando el EntityManager de la transacción
   */
  private async createTenantWithManager(
    manager: EntityManager,
    partnerId: number,
    partnerRequest: any,
    colors: { primary: string; secondary: string },
  ): Promise<TenantEntity> {
    // Validar que el partner exista
    const partnerEntity = await manager.findOne(PartnerEntity, {
      where: { id: partnerId },
    });
    if (!partnerEntity) {
      throw new NotFoundException(`Partner with ID ${partnerId} not found`);
    }

    // Obtener la suscripción del partner para usar su currencyId
    const subscriptionEntity = await manager.findOne(PartnerSubscriptionEntity, {
      where: { partnerId },
      order: { createdAt: 'DESC' },
    });

    if (!subscriptionEntity) {
      throw new NotFoundException(`Subscription not found for partner with ID ${partnerId}`);
    }

    // Usar el currencyId de la suscripción (puede ser null)
    const subscriptionCurrencyId = subscriptionEntity.currencyId;

    if (!subscriptionCurrencyId) {
      throw new BadRequestException(
        `Subscription currencyId is required to create tenant for partner ${partnerId}`,
      );
    }

    // Generar código único de búsqueda rápida para el tenant
    let tenantQuickSearchCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      tenantQuickSearchCode = generateTenantQuickSearchCode();
      const existingTenant = await manager.findOne(TenantEntity, {
        where: { quickSearchCode: tenantQuickSearchCode },
      });
      if (!existingTenant) {
        break;
      }
      attempts++;
      if (attempts >= maxAttempts) {
        throw new BadRequestException(
          'Failed to generate unique tenant quick search code after multiple attempts',
        );
      }
    } while (true);

    // Crear entidad de dominio del tenant usando el currencyId directamente como number
    const tenant = Tenant.create(
      partnerId,
      partnerRequest.name,
      partnerRequest.category,
      subscriptionCurrencyId,
      colors.primary,
      colors.secondary,
      tenantQuickSearchCode,
      365, // pointsExpireDays
      100, // minPointsToRedeem
      null, // description
      partnerRequest.logo || null, // logo
      null, // banner
      'active',
    );

    // Convertir a entidad de persistencia
    const tenantEntity = TenantMapper.toPersistence(tenant);

    // Guardar usando manager
    const savedTenantEntity = await manager.save(TenantEntity, tenantEntity);

    // Crear y guardar las características
    const features = TenantFeatures.create(
      savedTenantEntity.id,
      true, // qrScanning
      true, // offlineMode
      true, // referralProgram
      true, // birthdayRewards
    );
    const featuresEntity = TenantMapper.featuresToPersistence(features);
    featuresEntity.tenantId = savedTenantEntity.id;
    await manager.save(TenantFeaturesEntity, featuresEntity);

    // Incrementar contador de tenants en uso de suscripción
    // Reutilizar subscriptionEntity obtenido anteriormente
    if (subscriptionEntity) {
      const usageRepository = manager.getRepository(PartnerSubscriptionUsageEntity);
      const existingUsage = await usageRepository.findOne({
        where: { partnerSubscriptionId: subscriptionEntity.id },
      });

      if (existingUsage) {
        await usageRepository.increment(
          { partnerSubscriptionId: subscriptionEntity.id },
          'tenantsCount',
          1,
        );
      } else {
        // Crear registro de uso si no existe
        const usageEntity = usageRepository.create({
          partnerSubscriptionId: subscriptionEntity.id,
          tenantsCount: 1,
          branchesCount: 0,
          customersCount: 0,
          rewardsCount: 0,
        });
        await usageRepository.save(usageEntity);
      }
    }

    return savedTenantEntity;
  }

  /**
   * Crea una branch usando el EntityManager de la transacción
   */
  private async createBranchWithManager(
    manager: EntityManager,
    tenantId: number,
    partnerRequest: any,
    countryName: string,
  ): Promise<BranchEntity> {
    // Validar que el tenant exista
    const tenantEntity = await manager.findOne(TenantEntity, {
      where: { id: tenantId },
    });
    if (!tenantEntity) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    // Validar que fiscalAddress no sea null
    if (!partnerRequest.fiscalAddress) {
      throw new BadRequestException('Fiscal address is required to create branch');
    }

    // Generar código único de búsqueda rápida para la branch
    let branchQuickSearchCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      branchQuickSearchCode = generateBranchQuickSearchCode();
      const existingBranch = await manager.findOne(BranchEntity, {
        where: { quickSearchCode: branchQuickSearchCode },
      });
      if (!existingBranch) {
        break;
      }
      attempts++;
      if (attempts >= maxAttempts) {
        throw new BadRequestException(
          'Failed to generate unique branch quick search code after multiple attempts',
        );
      }
    } while (true);

    // Crear entidad de dominio de la branch
    const branch = Branch.create(
      tenantId,
      'Sucursal Principal', // name
      partnerRequest.fiscalAddress, // address
      partnerRequest.city, // city
      countryName, // country
      branchQuickSearchCode,
      partnerRequest.phone || null, // phone
      partnerRequest.email || null, // email
      'active',
    );

    // Convertir a entidad de persistencia
    const branchEntity = BranchMapper.toPersistence(branch);

    // Guardar usando manager
    const savedBranchEntity = await manager.save(BranchEntity, branchEntity);

    // Incrementar contador de branches en uso de suscripción
    const subscriptionEntity = await manager.findOne(PartnerSubscriptionEntity, {
      where: { partnerId: tenantEntity.partnerId },
      order: { createdAt: 'DESC' },
    });
    if (subscriptionEntity) {
      const usageRepository = manager.getRepository(PartnerSubscriptionUsageEntity);
      const existingUsage = await usageRepository.findOne({
        where: { partnerSubscriptionId: subscriptionEntity.id },
      });

      if (existingUsage) {
        await usageRepository.increment(
          { partnerSubscriptionId: subscriptionEntity.id },
          'branchesCount',
          1,
        );
      } else {
        // Crear registro de uso si no existe
        const usageEntity = usageRepository.create({
          partnerSubscriptionId: subscriptionEntity.id,
          tenantsCount: 0,
          branchesCount: 1,
          customersCount: 0,
          rewardsCount: 0,
        });
        await usageRepository.save(usageEntity);
      }
    }

    return savedBranchEntity;
  }

  /**
   * Crea un usuario partner usando el EntityManager de la transacción
   * Retorna el usuario creado y la contraseña temporal generada
   */
  private async createPartnerUserWithManager(
    manager: EntityManager,
    partnerId: number,
    partnerRequest: any,
  ): Promise<{ user: UserEntity; temporaryPassword: string }> {
    // Validar que el partner exista
    const partnerEntity = await manager.findOne(PartnerEntity, {
      where: { id: partnerId },
    });
    if (!partnerEntity) {
      throw new NotFoundException(`Partner with ID ${partnerId} not found`);
    }

    // Validar que el email no exista
    const existingUser = await manager.findOne(UserEntity, {
      where: { email: partnerRequest.email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Determinar nombre completo (priorizar responsibleName sobre name)
    const fullName =
      (partnerRequest.responsibleName && partnerRequest.responsibleName.trim()) ||
      (partnerRequest.name && partnerRequest.name.trim()) ||
      '';

    // Extraer firstName y lastName
    const { firstName, lastName } = extractFirstNameAndLastName(fullName);

    // Generar contraseña temporal aleatoria
    const temporaryPassword = generateRandomPassword(12);

    // Generar hash de la contraseña
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // Crear entidad de dominio del usuario
    const user = User.create(
      partnerRequest.email,
      fullName || 'Usuario Partner', // name
      firstName,
      lastName,
      partnerRequest.phone,
      passwordHash,
      ['PARTNER'], // roles
      null, // profile
      partnerId, // partnerId
      null, // tenantId
      null, // branchId
      null, // avatar
      'active', // status
    );

    // Convertir a entidad de persistencia
    const userEntity = UserMapper.toPersistence(user);

    // Guardar usando manager
    const savedUserEntity = await manager.save(UserEntity, userEntity);

    return { user: savedUserEntity, temporaryPassword };
  }
}

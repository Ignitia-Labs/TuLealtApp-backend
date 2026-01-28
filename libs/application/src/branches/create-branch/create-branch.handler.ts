import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ITenantRepository, IBranchRepository, IPartnerRepository, Branch } from '@libs/domain';
import { CreateBranchRequest } from './create-branch.request';
import { CreateBranchResponse } from './create-branch.response';
import { SubscriptionUsageHelper } from '@libs/application';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PartnerSubscriptionUsageEntity,
  PartnerSubscriptionEntity,
  TenantEntity,
  BranchEntity,
} from '@libs/infrastructure';
import { generateBranchQuickSearchCode } from '@libs/shared';

/**
 * Handler para el caso de uso de crear una branch
 */
@Injectable()
export class CreateBranchHandler {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
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
  ) {}

  async execute(request: CreateBranchRequest): Promise<CreateBranchResponse> {
    // Validar que el tenant exista
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Generar código único de búsqueda rápida
    let quickSearchCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      quickSearchCode = generateBranchQuickSearchCode();
      const existingBranch = await this.branchRepository.findByQuickSearchCode(quickSearchCode);
      if (!existingBranch) {
        break;
      }
      attempts++;
      if (attempts >= maxAttempts) {
        throw new BadRequestException(
          'Failed to generate unique quick search code after multiple attempts',
        );
      }
    } while (true);

    // Crear la entidad de dominio de la branch sin ID (la BD lo generará automáticamente)
    const branch = Branch.create(
      request.tenantId,
      request.name,
      request.address,
      request.city,
      request.country,
      quickSearchCode,
      request.phone || null,
      request.email || null,
      'active',
    );

    // Guardar la branch (la BD asignará el ID automáticamente)
    const savedBranch = await this.branchRepository.save(branch);

    // Recalcular subscription usage del partner afectado
    // Usar recálculo completo para asegurar que funcione incluso si no hay suscripción activa
    await SubscriptionUsageHelper.recalculateUsageForPartner(
      tenant.partnerId,
      this.subscriptionRepository,
      this.usageRepository,
      this.tenantEntityRepository,
      this.branchEntityRepository,
      true, // allowAnyStatus = true para actualizar incluso si la suscripción no está activa
    );

    // Retornar response DTO
    return new CreateBranchResponse(
      savedBranch.id,
      savedBranch.tenantId,
      savedBranch.name,
      savedBranch.address,
      savedBranch.status,
      savedBranch.createdAt,
    );
  }
}

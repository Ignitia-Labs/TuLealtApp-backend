import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ITenantRepository, ILoyaltyProgramRepository } from '@libs/domain';
import { SearchTenantByCodeRequest } from './search-tenant-by-code.request';
import {
  SearchTenantByCodeResponse,
  TenantPublicInfoDto,
  LoyaltyProgramPublicInfoDto,
} from './search-tenant-by-code.response';

/**
 * Handler para el caso de uso de buscar un tenant por código
 * Endpoint público que retorna información básica del tenant y sus programas activos
 */
@Injectable()
export class SearchTenantByCodeHandler {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
  ) {}

  async execute(request: SearchTenantByCodeRequest): Promise<SearchTenantByCodeResponse> {
    // Buscar tenant por código (case-insensitive)
    const tenant = await this.tenantRepository.findByQuickSearchCode(
      request.code.toUpperCase(),
    );

    if (!tenant) {
      throw new NotFoundException(`Tenant with code ${request.code} not found`);
    }

    // Verificar que el tenant esté activo
    if (!tenant.isActive()) {
      throw new NotFoundException(`Tenant with code ${request.code} is not active`);
    }

    // Buscar programas activos del tenant
    const programs = await this.programRepository.findActiveByTenantId(tenant.id);

    // Mapear información pública del tenant
    const tenantInfo: TenantPublicInfoDto = {
      id: tenant.id,
      name: tenant.name,
      description: tenant.description,
      logo: tenant.logo,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      category: tenant.category,
    };

    // Mapear información pública de los programas
    const programsInfo: LoyaltyProgramPublicInfoDto[] = programs.map((program) => ({
      id: program.id,
      name: program.name,
      description: program.description,
      programType: program.programType,
      activeFrom: program.activeFrom,
      activeTo: program.activeTo,
    }));

    return {
      tenant: tenantInfo,
      programs: programsInfo,
    };
  }
}

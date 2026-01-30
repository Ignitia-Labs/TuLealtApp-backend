import { Injectable, Inject } from '@nestjs/common';
import { ILoyaltyProgramRepository, ITenantRepository, LoyaltyProgram } from '@libs/domain';
import { GetLoyaltyProgramsRequest } from './get-loyalty-programs.request';
import { GetLoyaltyProgramsResponse } from './get-loyalty-programs.response';

/**
 * Handler para obtener programas de lealtad de un tenant
 */
@Injectable()
export class GetLoyaltyProgramsHandler {
  constructor(
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(request: GetLoyaltyProgramsRequest): Promise<GetLoyaltyProgramsResponse> {
    // Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new Error(`Tenant with ID ${request.tenantId} not found`);
    }

    // Obtener programas según filtros
    let programs: LoyaltyProgram[];

    if (request.status === 'active') {
      programs = await this.programRepository.findActiveByTenantId(request.tenantId);
    } else {
      programs = await this.programRepository.findByTenantId(request.tenantId);
    }

    // Filtrar por status si es necesario
    if (request.status === 'active') {
      programs = programs.filter((p) => p.isActive());
    } else if (request.status === 'inactive') {
      programs = programs.filter((p) => !p.isActive());
    }

    // Filtrar por tipo si es necesario
    if (request.programType && request.programType !== 'all') {
      programs = programs.filter((p) => p.programType === request.programType);
    }

    return new GetLoyaltyProgramsResponse(programs);
  }
}

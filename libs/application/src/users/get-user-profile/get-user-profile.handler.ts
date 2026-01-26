import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import {
  IUserRepository,
  IPartnerRepository,
  ITenantRepository,
  IBranchRepository,
} from '@libs/domain';
import { GetUserProfileRequest } from './get-user-profile.request';
import { GetUserProfileResponse } from './get-user-profile.response';
import { PartnerInfoDto } from '../../auth/partner-info.dto';
import { TenantInfoDto } from '../../auth/tenant-info.dto';
import { BranchInfoDto } from '../../auth/branch-info.dto';

/**
 * Handler para el caso de uso de obtener el perfil de un usuario
 */
@Injectable()
export class GetUserProfileHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
  ) {}

  async execute(request: GetUserProfileRequest): Promise<GetUserProfileResponse> {
    const user = await this.userRepository.findById(request.userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${request.userId} not found`);
    }

    // Obtener información del partner si existe
    let partnerInfo: PartnerInfoDto | null = null;
    if (user.partnerId) {
      const partner = await this.partnerRepository.findById(user.partnerId);
      if (partner) {
        partnerInfo = new PartnerInfoDto(
          partner.id,
          partner.name,
          partner.domain,
          partner.email,
          partner.status,
        );
      }
    }

    // Obtener información del tenant si existe
    let tenantInfo: TenantInfoDto | null = null;
    if (user.tenantId) {
      const tenant = await this.tenantRepository.findById(user.tenantId);
      if (tenant) {
        tenantInfo = new TenantInfoDto(
          tenant.id,
          tenant.name,
          tenant.partnerId,
          tenant.quickSearchCode,
          tenant.status,
        );
      }
    }

    // Obtener información del branch si existe
    let branchInfo: BranchInfoDto | null = null;
    if (user.branchId) {
      const branch = await this.branchRepository.findById(user.branchId);
      if (branch) {
        branchInfo = new BranchInfoDto(
          branch.id,
          branch.name,
          branch.tenantId,
          branch.quickSearchCode,
          branch.status,
        );
      }
    }

    return new GetUserProfileResponse(
      user.id,
      user.email,
      user.name,
      user.firstName,
      user.lastName,
      user.phone,
      user.profile,
      user.roles,
      user.isActive,
      user.partnerId,
      user.tenantId,
      user.branchId,
      user.createdAt,
      user.updatedAt,
      partnerInfo,
      tenantInfo,
      branchInfo,
    );
  }
}

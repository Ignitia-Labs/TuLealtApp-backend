import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IInvitationCodeRepository } from '@libs/domain';
import { GetInvitationCodeByCodeRequest } from './get-invitation-code-by-code.request';
import { GetInvitationCodeByCodeResponse } from './get-invitation-code-by-code.response';

/**
 * Handler para el caso de uso de obtener un código de invitación por su valor
 */
@Injectable()
export class GetInvitationCodeByCodeHandler {
  constructor(
    @Inject('IInvitationCodeRepository')
    private readonly invitationCodeRepository: IInvitationCodeRepository,
  ) {}

  async execute(request: GetInvitationCodeByCodeRequest): Promise<GetInvitationCodeByCodeResponse> {
    const code = await this.invitationCodeRepository.findByCode(request.code);

    if (!code) {
      throw new NotFoundException(`Invitation code "${request.code}" not found`);
    }

    return new GetInvitationCodeByCodeResponse(
      code.id,
      code.code,
      code.tenantId,
      code.branchId,
      code.type,
      code.maxUses,
      code.currentUses,
      code.expiresAt,
      code.status,
      code.createdBy,
      code.createdAt,
      code.updatedAt,
    );
  }
}

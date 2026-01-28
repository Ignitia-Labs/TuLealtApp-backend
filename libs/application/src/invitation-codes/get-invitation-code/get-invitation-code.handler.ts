import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IInvitationCodeRepository } from '@libs/domain';
import { GetInvitationCodeRequest } from './get-invitation-code.request';
import { GetInvitationCodeResponse } from './get-invitation-code.response';

/**
 * Handler para el caso de uso de obtener un código de invitación por ID
 */
@Injectable()
export class GetInvitationCodeHandler {
  constructor(
    @Inject('IInvitationCodeRepository')
    private readonly invitationCodeRepository: IInvitationCodeRepository,
  ) {}

  async execute(request: GetInvitationCodeRequest): Promise<GetInvitationCodeResponse> {
    const code = await this.invitationCodeRepository.findById(request.id);

    if (!code) {
      throw new NotFoundException(`Invitation code with ID ${request.id} not found`);
    }

    return new GetInvitationCodeResponse(
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

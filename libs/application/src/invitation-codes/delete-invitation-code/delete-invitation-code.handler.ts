import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IInvitationCodeRepository } from '@libs/domain';
import { DeleteInvitationCodeRequest } from './delete-invitation-code.request';
import { DeleteInvitationCodeResponse } from './delete-invitation-code.response';

/**
 * Handler para el caso de uso de eliminar un código de invitación
 */
@Injectable()
export class DeleteInvitationCodeHandler {
  constructor(
    @Inject('IInvitationCodeRepository')
    private readonly invitationCodeRepository: IInvitationCodeRepository,
  ) {}

  async execute(request: DeleteInvitationCodeRequest): Promise<DeleteInvitationCodeResponse> {
    // Verificar que el código existe
    const code = await this.invitationCodeRepository.findById(request.id);

    if (!code) {
      throw new NotFoundException(`Invitation code with ID ${request.id} not found`);
    }

    // Eliminar el código
    await this.invitationCodeRepository.delete(request.id);

    return new DeleteInvitationCodeResponse('Invitation code deleted successfully', request.id);
  }
}

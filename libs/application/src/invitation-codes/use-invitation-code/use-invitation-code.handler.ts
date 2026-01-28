import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IInvitationCodeRepository } from '@libs/domain';
import { UseInvitationCodeRequest } from './use-invitation-code.request';
import { UseInvitationCodeResponse } from './use-invitation-code.response';

/**
 * Handler para el caso de uso de registrar uso de un código de invitación
 * Este endpoint permite incrementar manualmente el contador de usos
 */
@Injectable()
export class UseInvitationCodeHandler {
  constructor(
    @Inject('IInvitationCodeRepository')
    private readonly invitationCodeRepository: IInvitationCodeRepository,
  ) {}

  async execute(request: UseInvitationCodeRequest): Promise<UseInvitationCodeResponse> {
    // Buscar el código
    const code = await this.invitationCodeRepository.findById(request.id);

    if (!code) {
      throw new NotFoundException(`Invitation code with ID ${request.id} not found`);
    }

    // Validar que el código es válido para usar
    if (!code.isValid()) {
      throw new BadRequestException(
        `Invitation code "${code.code}" is not valid (expired, disabled, or limit reached)`,
      );
    }

    // Incrementar el contador de usos usando el método de dominio
    const updatedCode = code.incrementUses();

    // Guardar el código actualizado
    const savedCode = await this.invitationCodeRepository.update(updatedCode);

    // Determinar mensaje según el estado
    let message = 'Invitation code used successfully';
    if (savedCode.hasReachedLimit()) {
      message = 'Invitation code used successfully. Maximum uses reached.';
    }

    return new UseInvitationCodeResponse(
      savedCode.id,
      savedCode.code,
      savedCode.currentUses,
      savedCode.maxUses,
      savedCode.status,
      message,
    );
  }
}

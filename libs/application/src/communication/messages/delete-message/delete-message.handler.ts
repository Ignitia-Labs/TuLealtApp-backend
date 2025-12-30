import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPartnerMessageRepository } from '@libs/domain';
import { DeleteMessageResponse } from './delete-message.response';

/**
 * Handler para eliminar un mensaje (solo si está en estado draft)
 */
@Injectable()
export class DeleteMessageHandler {
  constructor(
    @Inject('IPartnerMessageRepository')
    private readonly messageRepository: IPartnerMessageRepository,
  ) {}

  async execute(messageId: number): Promise<DeleteMessageResponse> {
    const message = await this.messageRepository.findById(messageId);

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    // Validar que el mensaje esté en estado draft
    if (!message.canBeDeleted()) {
      throw new BadRequestException(
        `Message with ID ${messageId} cannot be deleted. Only draft messages can be deleted.`,
      );
    }

    await this.messageRepository.delete(messageId);

    return new DeleteMessageResponse(true, 'Mensaje eliminado exitosamente');
  }
}


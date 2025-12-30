import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IMessageTemplateRepository } from '@libs/domain';
import { DeleteTemplateResponse } from './delete-template.response';

/**
 * Handler para eliminar una plantilla
 */
@Injectable()
export class DeleteTemplateHandler {
  constructor(
    @Inject('IMessageTemplateRepository')
    private readonly templateRepository: IMessageTemplateRepository,
  ) {}

  async execute(templateId: number): Promise<DeleteTemplateResponse> {
    const template = await this.templateRepository.findById(templateId);

    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    await this.templateRepository.delete(templateId);

    return new DeleteTemplateResponse(true, 'Plantilla eliminada exitosamente');
  }
}


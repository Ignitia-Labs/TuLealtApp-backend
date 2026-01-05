import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IMessageTemplateRepository } from '@libs/domain';
import { UpdateTemplateRequest } from './update-template.request';
import { UpdateTemplateResponse } from './update-template.response';

/**
 * Handler para actualizar una plantilla
 */
@Injectable()
export class UpdateTemplateHandler {
  constructor(
    @Inject('IMessageTemplateRepository')
    private readonly templateRepository: IMessageTemplateRepository,
  ) {}

  async execute(
    templateId: number,
    request: UpdateTemplateRequest,
  ): Promise<UpdateTemplateResponse> {
    const template = await this.templateRepository.findById(templateId);

    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    const updatedTemplate = template.update(
      request.name,
      request.subject,
      request.body,
      request.variables,
      request.isActive,
    );

    const savedTemplate = await this.templateRepository.update(updatedTemplate);

    return new UpdateTemplateResponse(
      savedTemplate.id,
      savedTemplate.name,
      savedTemplate.type,
      savedTemplate.subject,
      savedTemplate.body,
      savedTemplate.variables,
      savedTemplate.usageCount,
      savedTemplate.createdAt,
      savedTemplate.updatedAt,
      savedTemplate.createdBy,
      savedTemplate.isActive,
    );
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IMessageTemplateRepository } from '@libs/domain';
import { GetTemplateResponse } from './get-template.response';

/**
 * Handler para obtener una plantilla por ID
 */
@Injectable()
export class GetTemplateHandler {
  constructor(
    @Inject('IMessageTemplateRepository')
    private readonly templateRepository: IMessageTemplateRepository,
  ) {}

  async execute(templateId: number): Promise<GetTemplateResponse> {
    const template = await this.templateRepository.findById(templateId);

    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    return new GetTemplateResponse(
      template.id,
      template.name,
      template.type,
      template.subject,
      template.body,
      template.variables,
      template.usageCount,
      template.createdAt,
      template.updatedAt,
      template.createdBy,
      template.isActive,
    );
  }
}


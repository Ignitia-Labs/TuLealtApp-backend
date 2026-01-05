import { Injectable, Inject } from '@nestjs/common';
import { IMessageTemplateRepository, MessageTemplate } from '@libs/domain';
import { CreateTemplateRequest } from './create-template.request';
import { CreateTemplateResponse } from './create-template.response';

/**
 * Handler para crear una nueva plantilla de mensaje
 */
@Injectable()
export class CreateTemplateHandler {
  constructor(
    @Inject('IMessageTemplateRepository')
    private readonly templateRepository: IMessageTemplateRepository,
  ) {}

  async execute(
    request: CreateTemplateRequest,
    createdBy?: number,
  ): Promise<CreateTemplateResponse> {
    const template = MessageTemplate.create(
      request.name,
      request.type,
      request.subject,
      request.body,
      request.variables,
      createdBy || null,
      request.isActive ?? true,
    );

    const savedTemplate = await this.templateRepository.save(template);

    return new CreateTemplateResponse(
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

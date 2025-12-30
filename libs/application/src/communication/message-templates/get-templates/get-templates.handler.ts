import { Injectable, Inject } from '@nestjs/common';
import { IMessageTemplateRepository } from '@libs/domain';
import { GetTemplatesRequest } from './get-templates.request';
import { GetTemplatesResponse, TemplateDto } from './get-templates.response';

/**
 * Handler para obtener plantillas
 */
@Injectable()
export class GetTemplatesHandler {
  constructor(
    @Inject('IMessageTemplateRepository')
    private readonly templateRepository: IMessageTemplateRepository,
  ) {}

  async execute(request: GetTemplatesRequest): Promise<GetTemplatesResponse> {
    const templates = await this.templateRepository.findAll({
      type: request.type,
      isActive: request.isActive,
      search: request.search,
    });

    const templateDtos = templates.map(
      (template) =>
        new TemplateDto(
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
        ),
    );

    return new GetTemplatesResponse(templateDtos, templateDtos.length);
  }
}


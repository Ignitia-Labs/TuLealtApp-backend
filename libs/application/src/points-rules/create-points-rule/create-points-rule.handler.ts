import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ITenantRepository, IPointsRuleRepository, PointsRule } from '@libs/domain';
import { CreatePointsRuleRequest } from './create-points-rule.request';
import { CreatePointsRuleResponse } from './create-points-rule.response';
import { PointsRuleDto } from '../dto/points-rule.dto';

/**
 * Handler para el caso de uso de crear una regla de puntos
 */
@Injectable()
export class CreatePointsRuleHandler {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IPointsRuleRepository')
    private readonly pointsRuleRepository: IPointsRuleRepository,
  ) {}

  async execute(request: CreatePointsRuleRequest): Promise<CreatePointsRuleResponse> {
    // Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Validar fechas
    if (request.validFrom && request.validUntil) {
      const validFromDate = new Date(request.validFrom);
      const validUntilDate = new Date(request.validUntil);
      if (validFromDate >= validUntilDate) {
        throw new BadRequestException('validFrom must be before validUntil');
      }
    }

    // Validar horario aplicable
    if (request.applicableHours) {
      const startTime = this.parseTime(request.applicableHours.start);
      const endTime = this.parseTime(request.applicableHours.end);
      if (startTime >= endTime) {
        throw new BadRequestException('applicableHours.start must be before applicableHours.end');
      }
    }

    // Validar días aplicables (deben estar entre 0 y 6)
    if (request.applicableDays) {
      const invalidDays = request.applicableDays.filter((day) => day < 0 || day > 6);
      if (invalidDays.length > 0) {
        throw new BadRequestException(
          'applicableDays must contain values between 0 (Sunday) and 6 (Saturday)',
        );
      }
    }

    // Convertir fechas de string a Date si se proporcionan
    const validFrom = request.validFrom ? new Date(request.validFrom) : null;
    const validUntil = request.validUntil ? new Date(request.validUntil) : null;

    // Crear la entidad de dominio
    const rule = PointsRule.create(
      request.tenantId,
      request.name,
      request.description,
      request.type,
      request.pointsPerUnit,
      request.priority ?? 1,
      request.multiplier ?? null,
      request.minAmount ?? null,
      request.applicableDays ?? null,
      request.applicableHours ?? null,
      validFrom,
      validUntil,
      request.status ?? 'active',
    );

    // Guardar la regla
    const savedRule = await this.pointsRuleRepository.save(rule);

    // Convertir a DTO
    const ruleDto = new PointsRuleDto(
      savedRule.id,
      savedRule.tenantId,
      savedRule.name,
      savedRule.description,
      savedRule.type,
      savedRule.pointsPerUnit,
      savedRule.minAmount,
      savedRule.multiplier,
      savedRule.applicableDays,
      savedRule.applicableHours,
      savedRule.validFrom,
      savedRule.validUntil,
      savedRule.status,
      savedRule.priority,
      savedRule.createdAt,
      savedRule.updatedAt,
    );

    return new CreatePointsRuleResponse(ruleDto);
  }

  /**
   * Parsea un string de tiempo (HH:mm) a minutos desde medianoche
   */
  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

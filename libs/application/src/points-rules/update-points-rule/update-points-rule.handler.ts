import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPointsRuleRepository, PointsRule } from '@libs/domain';
import { UpdatePointsRuleRequest } from './update-points-rule.request';
import { UpdatePointsRuleResponse } from './update-points-rule.response';
import { PointsRuleDto } from '../dto/points-rule.dto';

/**
 * Handler para el caso de uso de actualizar una regla de puntos
 * Permite actualización parcial (PATCH) de todos los campos
 */
@Injectable()
export class UpdatePointsRuleHandler {
  constructor(
    @Inject('IPointsRuleRepository')
    private readonly pointsRuleRepository: IPointsRuleRepository,
  ) {}

  async execute(
    pointsRuleId: number,
    request: UpdatePointsRuleRequest,
  ): Promise<UpdatePointsRuleResponse> {
    // Buscar la regla existente
    const existingRule = await this.pointsRuleRepository.findById(pointsRuleId);

    if (!existingRule) {
      throw new NotFoundException(`Points rule with ID ${pointsRuleId} not found`);
    }

    // Validar fechas si se proporcionan ambas
    const validFrom =
      request.validFrom !== undefined
        ? request.validFrom
          ? new Date(request.validFrom)
          : null
        : existingRule.validFrom;
    const validUntil =
      request.validUntil !== undefined
        ? request.validUntil
          ? new Date(request.validUntil)
          : null
        : existingRule.validUntil;

    if (validFrom && validUntil && validFrom >= validUntil) {
      throw new BadRequestException('validFrom must be before validUntil');
    }

    // Validar horario aplicable si se proporciona
    const applicableHours =
      request.applicableHours !== undefined
        ? request.applicableHours
        : existingRule.applicableHours;
    if (applicableHours) {
      const startTime = this.parseTime(applicableHours.start);
      const endTime = this.parseTime(applicableHours.end);
      if (startTime >= endTime) {
        throw new BadRequestException('applicableHours.start must be before applicableHours.end');
      }
    }

    // Validar días aplicables si se proporcionan
    const applicableDays =
      request.applicableDays !== undefined ? request.applicableDays : existingRule.applicableDays;
    if (applicableDays) {
      const invalidDays = applicableDays.filter((day) => day < 0 || day > 6);
      if (invalidDays.length > 0) {
        throw new BadRequestException(
          'applicableDays must contain values between 0 (Sunday) and 6 (Saturday)',
        );
      }
    }

    // Crear regla actualizada con valores nuevos o existentes
    // Usar el constructor directamente para preservar createdAt y actualizar updatedAt
    const updatedRule = new PointsRule(
      existingRule.id,
      existingRule.tenantId, // No se puede cambiar el tenantId
      request.name ?? existingRule.name,
      request.description ?? existingRule.description,
      request.type ?? existingRule.type,
      request.pointsPerUnit ?? existingRule.pointsPerUnit,
      request.multiplier !== undefined ? request.multiplier : existingRule.multiplier,
      request.minAmount !== undefined ? request.minAmount : existingRule.minAmount,
      applicableDays,
      applicableHours,
      validFrom,
      validUntil,
      request.status ?? existingRule.status,
      request.priority ?? existingRule.priority,
      existingRule.createdAt, // Preservar fecha de creación
      new Date(), // Actualizar fecha de modificación
    );

    // Guardar la regla actualizada
    const savedRule = await this.pointsRuleRepository.update(updatedRule);

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

    return new UpdatePointsRuleResponse(ruleDto);
  }

  /**
   * Parsea un string de tiempo (HH:mm) a minutos desde medianoche
   */
  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

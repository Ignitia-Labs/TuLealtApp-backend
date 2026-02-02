import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ILoyaltyProgramRepository, ITenantRepository, EarningDomain } from '@libs/domain';
import { LoyaltyProgramValidator } from '../loyalty-program-validator.service';
import { UpdateLoyaltyProgramRequest } from './update-loyalty-program.request';
import { UpdateLoyaltyProgramResponse } from './update-loyalty-program.response';

/**
 * Handler para actualizar un programa de lealtad existente
 */
@Injectable()
export class UpdateLoyaltyProgramHandler {
  constructor(
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    private readonly programValidator: LoyaltyProgramValidator,
  ) {}

  async execute(request: UpdateLoyaltyProgramRequest): Promise<UpdateLoyaltyProgramResponse> {
    // Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Obtener programa existente
    const existingProgram = await this.programRepository.findById(request.programId);
    if (!existingProgram) {
      throw new NotFoundException(`Loyalty program with ID ${request.programId} not found`);
    }

    // Validar que el programa pertenece al tenant
    if (existingProgram.tenantId !== request.tenantId) {
      throw new NotFoundException(
        `Loyalty program ${request.programId} does not belong to tenant ${request.tenantId}`,
      );
    }

    // Preparar actualizaciones
    const updates: Parameters<typeof existingProgram.createNewVersion>[0] = {};

    if (request.name !== undefined) {
      updates.name = request.name;
    }
    if (request.description !== undefined) {
      updates.description = request.description;
    }
    if (request.priorityRank !== undefined) {
      updates.priorityRank = request.priorityRank;
    }
    if (request.stacking !== undefined) {
      updates.stacking = {
        allowed: request.stacking.allowed ?? existingProgram.stacking.allowed,
        maxProgramsPerEvent: request.stacking.maxProgramsPerEvent,
        maxProgramsPerPeriod: request.stacking.maxProgramsPerPeriod,
        period: request.stacking.period,
        selectionStrategy: request.stacking.selectionStrategy,
      };
    }
    if (request.expirationPolicy !== undefined) {
      updates.expirationPolicy = {
        enabled: request.expirationPolicy.enabled ?? existingProgram.expirationPolicy.enabled,
        type: request.expirationPolicy.type ?? existingProgram.expirationPolicy.type,
        daysToExpire: request.expirationPolicy.daysToExpire,
        gracePeriodDays: request.expirationPolicy.gracePeriodDays,
      };
    }
    if (request.minPointsToRedeem !== undefined) {
      updates.minPointsToRedeem = request.minPointsToRedeem;
    }
    if (request.currency !== undefined) {
      updates.currency = request.currency;
    }
    if (request.limits !== undefined) {
      updates.limits = request.limits
        ? {
            maxPointsPerEvent: request.limits.maxPointsPerEvent,
            maxPointsPerDay: request.limits.maxPointsPerDay,
            maxPointsPerMonth: request.limits.maxPointsPerMonth,
            maxPointsPerYear: request.limits.maxPointsPerYear,
          }
        : null;
    }

    // Crear nueva versión del programa
    let updatedProgram = existingProgram.createNewVersion(updates);

    // Helper function para determinar el valor final de activeFrom
    const getFinalActiveFrom = (): Date | null => {
      if (request.activeFrom === null) {
        return null; // null explícito = siempre vigente
      } else if (request.activeFrom !== undefined) {
        return new Date(request.activeFrom); // Fecha específica proporcionada
      }
      return updatedProgram.activeFrom; // undefined = mantener valor existente
    };

    // Helper function para determinar el valor final de activeTo
    const getFinalActiveTo = (): Date | null => {
      if (request.activeTo === null) {
        return null; // null explícito = siempre vigente
      } else if (request.activeTo !== undefined) {
        return new Date(request.activeTo); // Fecha específica proporcionada
      }
      return updatedProgram.activeTo; // undefined = mantener valor existente
    };

    // Actualizar status si se proporciona
    if (request.status !== undefined) {
      if (request.status === 'active') {
        // Activar programa: manejar activeFrom explícitamente
        const activeFromValue =
          request.activeFrom === null
            ? null
            : request.activeFrom !== undefined
              ? new Date(request.activeFrom)
              : undefined;

        updatedProgram = updatedProgram.activate(activeFromValue);

        // Si activeTo se proporciona explícitamente (null o fecha), actualizarlo
        if (request.activeTo !== undefined) {
          const finalActiveTo = getFinalActiveTo();
          updatedProgram = new (updatedProgram.constructor as any)(
            updatedProgram.id,
            updatedProgram.tenantId,
            updatedProgram.name,
            updatedProgram.description,
            updatedProgram.programType,
            updatedProgram.earningDomains,
            updatedProgram.priorityRank,
            updatedProgram.stacking,
            updatedProgram.limits,
            updatedProgram.expirationPolicy,
            updatedProgram.currency,
            updatedProgram.minPointsToRedeem,
            updatedProgram.status,
            updatedProgram.version,
            updatedProgram.activeFrom,
            finalActiveTo,
            updatedProgram.createdAt,
            new Date(),
          );
        }
      } else if (request.status === 'inactive') {
        updatedProgram = updatedProgram.deactivate();
      } else {
        // draft - crear nueva instancia con status draft
        const finalActiveFrom = getFinalActiveFrom();
        const finalActiveTo = getFinalActiveTo();
        updatedProgram = new (updatedProgram.constructor as any)(
          updatedProgram.id,
          updatedProgram.tenantId,
          updatedProgram.name,
          updatedProgram.description,
          updatedProgram.programType,
          updatedProgram.earningDomains,
          updatedProgram.priorityRank,
          updatedProgram.stacking,
          updatedProgram.limits,
          updatedProgram.expirationPolicy,
          updatedProgram.currency,
          updatedProgram.minPointsToRedeem,
          'draft',
          updatedProgram.version,
          finalActiveFrom,
          finalActiveTo,
          updatedProgram.createdAt,
          new Date(),
        );
      }
    } else {
      // Actualizar activeFrom/activeTo si se proporcionan sin cambiar status
      if (request.activeFrom !== undefined || request.activeTo !== undefined) {
        const finalActiveFrom = getFinalActiveFrom();
        const finalActiveTo = getFinalActiveTo();
        updatedProgram = new (updatedProgram.constructor as any)(
          updatedProgram.id,
          updatedProgram.tenantId,
          updatedProgram.name,
          updatedProgram.description,
          updatedProgram.programType,
          updatedProgram.earningDomains,
          updatedProgram.priorityRank,
          updatedProgram.stacking,
          updatedProgram.limits,
          updatedProgram.expirationPolicy,
          updatedProgram.currency,
          updatedProgram.minPointsToRedeem,
          updatedProgram.status,
          updatedProgram.version,
          finalActiveFrom,
          finalActiveTo,
          updatedProgram.createdAt,
          new Date(),
        );
      }
    }

    // Validar programa actualizado
    await this.programValidator.validateProgram(updatedProgram);

    // Guardar programa actualizado
    const savedProgram = await this.programRepository.save(updatedProgram);

    return new UpdateLoyaltyProgramResponse(savedProgram);
  }
}

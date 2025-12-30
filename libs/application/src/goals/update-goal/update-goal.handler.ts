import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IGoalRepository } from '@libs/domain';
import { UpdateGoalRequest } from './update-goal.request';
import { UpdateGoalResponse } from './update-goal.response';

/**
 * Handler para actualizar una meta
 */
@Injectable()
export class UpdateGoalHandler {
  constructor(
    @Inject('IGoalRepository')
    private readonly goalRepository: IGoalRepository,
  ) {}

  async execute(request: UpdateGoalRequest): Promise<UpdateGoalResponse> {
    if (!request.goalId) {
      throw new BadRequestException('goalId is required');
    }

    const goal = await this.goalRepository.findById(request.goalId);

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${request.goalId} not found`);
    }

    // Validar fechas si se proporcionan
    let periodStart = goal.periodStart;
    let periodEnd = goal.periodEnd;

    if (request.periodStart) {
      periodStart = new Date(request.periodStart);
      if (isNaN(periodStart.getTime())) {
        throw new BadRequestException('Invalid periodStart format. Use ISO 8601 format.');
      }
    }

    if (request.periodEnd) {
      periodEnd = new Date(request.periodEnd);
      if (isNaN(periodEnd.getTime())) {
        throw new BadRequestException('Invalid periodEnd format. Use ISO 8601 format.');
      }
    }

    if (periodStart >= periodEnd) {
      throw new BadRequestException('periodStart must be before periodEnd');
    }

    // Actualizar la meta
    const updatedGoal = goal.update(
      request.name,
      request.description !== undefined ? request.description : undefined,
      request.targetValue,
      request.periodStart ? periodStart : undefined,
      request.periodEnd ? periodEnd : undefined,
      request.isActive,
    );

    // Guardar cambios
    const savedGoal = await this.goalRepository.update(updatedGoal);

    return new UpdateGoalResponse(
      savedGoal.id,
      savedGoal.name,
      savedGoal.description,
      savedGoal.metric,
      savedGoal.targetValue,
      savedGoal.periodStart,
      savedGoal.periodEnd,
      savedGoal.isActive,
      savedGoal.updatedAt,
    );
  }
}


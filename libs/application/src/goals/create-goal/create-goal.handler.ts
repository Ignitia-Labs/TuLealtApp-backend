import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IGoalRepository, Goal } from '@libs/domain';
import { CreateGoalRequest } from './create-goal.request';
import { CreateGoalResponse } from './create-goal.response';

/**
 * Handler para crear una nueva meta
 */
@Injectable()
export class CreateGoalHandler {
  constructor(
    @Inject('IGoalRepository')
    private readonly goalRepository: IGoalRepository,
  ) {}

  async execute(request: CreateGoalRequest): Promise<CreateGoalResponse> {
    // Validar fechas
    const periodStart = new Date(request.periodStart);
    const periodEnd = new Date(request.periodEnd);

    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
      throw new BadRequestException('Invalid date format. Use ISO 8601 format.');
    }

    if (periodStart >= periodEnd) {
      throw new BadRequestException('periodStart must be before periodEnd');
    }

    // Validar valor objetivo
    if (request.targetValue < 0) {
      throw new BadRequestException('targetValue must be greater than or equal to 0');
    }

    // Crear la meta
    const goal = Goal.create(
      request.name,
      request.description ?? null,
      request.metric,
      request.targetValue,
      periodStart,
      periodEnd,
      request.isActive ?? true,
    );

    // Guardar la meta
    const savedGoal = await this.goalRepository.save(goal);

    return new CreateGoalResponse(
      savedGoal.id,
      savedGoal.name,
      savedGoal.description,
      savedGoal.metric,
      savedGoal.targetValue,
      savedGoal.periodStart,
      savedGoal.periodEnd,
      savedGoal.isActive,
      savedGoal.createdAt,
      savedGoal.updatedAt,
    );
  }
}


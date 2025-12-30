import { Injectable, Inject } from '@nestjs/common';
import { IGoalRepository } from '@libs/domain';
import { GetGoalsRequest } from './get-goals.request';
import { GetGoalsResponse } from './get-goals.response';
import { GetGoalHandler } from '../get-goal/get-goal.handler';
import { GetGoalRequest } from '../get-goal/get-goal.request';

/**
 * Handler para obtener todas las metas
 */
@Injectable()
export class GetGoalsHandler {
  constructor(
    @Inject('IGoalRepository')
    private readonly goalRepository: IGoalRepository,
    private readonly getGoalHandler: GetGoalHandler,
  ) {}

  async execute(request: GetGoalsRequest): Promise<GetGoalsResponse> {
    // Obtener todas las metas
    const goals = await this.goalRepository.findAll(request.activeOnly ?? false);

    // Aplicar paginación si se proporciona
    let paginatedGoals = goals;
    if (request.page && request.limit) {
      const skip = (request.page - 1) * request.limit;
      paginatedGoals = goals.slice(skip, skip + request.limit);
    }

    // Obtener detalles completos de cada meta (con progreso)
    const goalResponses = await Promise.all(
      paginatedGoals.map(async (goal) => {
        const getGoalRequest = new GetGoalRequest();
        getGoalRequest.goalId = goal.id;
        return this.getGoalHandler.execute(getGoalRequest);
      }),
    );

    return new GetGoalsResponse(
      goalResponses,
      goals.length,
      request.page || null,
      request.limit || null,
    );
  }
}


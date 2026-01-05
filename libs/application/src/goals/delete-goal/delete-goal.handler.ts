import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IGoalRepository } from '@libs/domain';
import { DeleteGoalRequest } from './delete-goal.request';
import { DeleteGoalResponse } from './delete-goal.response';

/**
 * Handler para eliminar una meta
 */
@Injectable()
export class DeleteGoalHandler {
  constructor(
    @Inject('IGoalRepository')
    private readonly goalRepository: IGoalRepository,
  ) {}

  async execute(request: DeleteGoalRequest): Promise<DeleteGoalResponse> {
    const goal = await this.goalRepository.findById(request.goalId);

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${request.goalId} not found`);
    }

    await this.goalRepository.delete(request.goalId);

    return new DeleteGoalResponse(request.goalId, 'Goal deleted successfully');
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { GetGoalResponse } from '../get-goal/get-goal.response';

export class GetGoalsResponse {
  @ApiProperty({
    description: 'Lista de metas',
    type: [GetGoalResponse],
  })
  goals: GetGoalResponse[];

  @ApiProperty({ description: 'Total de metas', example: 10 })
  total: number;

  @ApiProperty({ description: 'Página actual', example: 1, nullable: true })
  page: number | null;

  @ApiProperty({ description: 'Límite de elementos por página', example: 10, nullable: true })
  limit: number | null;

  constructor(
    goals: GetGoalResponse[],
    total: number,
    page: number | null,
    limit: number | null,
  ) {
    this.goals = goals;
    this.total = total;
    this.page = page;
    this.limit = limit;
  }
}


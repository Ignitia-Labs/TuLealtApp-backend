import { ApiProperty } from '@nestjs/swagger';
import { GoalStatus } from '@libs/domain';

export class ProgressInfo {
  @ApiProperty({ description: 'Valor actual', example: 8500 })
  currentValue: number;

  @ApiProperty({ description: 'Valor objetivo', example: 10000 })
  targetValue: number;

  @ApiProperty({ description: 'Progreso (%)', example: 85 })
  progress: number;

  constructor(currentValue: number, targetValue: number, progress: number) {
    this.currentValue = currentValue;
    this.targetValue = targetValue;
    this.progress = progress;
  }
}

export class ProjectionInfo {
  @ApiProperty({ description: 'Valor proyectado', example: 10200 })
  projectedValue: number;

  @ApiProperty({ description: 'Progreso proyectado (%)', example: 102 })
  projectedProgress: number;

  constructor(projectedValue: number, projectedProgress: number) {
    this.projectedValue = projectedValue;
    this.projectedProgress = projectedProgress;
  }
}

export class TrendInfo {
  @ApiProperty({ description: 'Cambio absoluto', example: 500 })
  change: number;

  @ApiProperty({ description: 'Cambio porcentual', example: 6.25 })
  changePercentage: number;

  constructor(change: number, changePercentage: number) {
    this.change = change;
    this.changePercentage = changePercentage;
  }
}

export class GetGoalProgressResponse {
  @ApiProperty({ description: 'ID de la meta', example: 1 })
  goalId: number;

  @ApiProperty({ description: 'Información de progreso', type: ProgressInfo })
  progress: ProgressInfo;

  @ApiProperty({ description: 'Información de proyección', type: ProjectionInfo })
  projection: ProjectionInfo;

  @ApiProperty({
    description: 'Estado de la meta',
    enum: ['on_track', 'at_risk', 'behind', 'achieved'],
    example: 'on_track',
  })
  status: GoalStatus;

  @ApiProperty({ description: 'Información de tendencia', type: TrendInfo, nullable: true })
  trend: TrendInfo | null;

  @ApiProperty({
    description: 'Fecha de cálculo',
    example: '2024-02-15T10:30:00.000Z',
  })
  calculatedAt: Date;

  constructor(
    goalId: number,
    progress: ProgressInfo,
    projection: ProjectionInfo,
    status: GoalStatus,
    trend: TrendInfo | null,
    calculatedAt: Date,
  ) {
    this.goalId = goalId;
    this.progress = progress;
    this.projection = projection;
    this.status = status;
    this.trend = trend;
    this.calculatedAt = calculatedAt;
  }
}


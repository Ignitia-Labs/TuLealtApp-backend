import { ApiProperty } from '@nestjs/swagger';
import { GoalMetric, GoalStatus } from '@libs/domain';

export class GetGoalResponse {
  @ApiProperty({ description: 'ID de la meta', example: 1 })
  id: number;

  @ApiProperty({ description: 'Nombre de la meta', example: 'Aumentar MRR en Q1 2024' })
  name: string;

  @ApiProperty({
    description: 'Descripción de la meta',
    example: 'Meta para aumentar el MRR en un 20% durante el primer trimestre',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Métrica a medir',
    enum: [
      'mrr',
      'arr',
      'activeSubscriptions',
      'churnRate',
      'retentionRate',
      'newSubscriptions',
      'upgrades',
    ],
    example: 'mrr',
  })
  metric: GoalMetric;

  @ApiProperty({ description: 'Valor objetivo', example: 10000 })
  targetValue: number;

  @ApiProperty({ description: 'Valor actual', example: 8500 })
  currentValue: number;

  @ApiProperty({ description: 'Progreso (%)', example: 85 })
  progress: number;

  @ApiProperty({
    description: 'Estado de la meta',
    enum: ['on_track', 'at_risk', 'behind', 'achieved'],
    example: 'on_track',
  })
  status: GoalStatus;

  @ApiProperty({
    description: 'Fecha de inicio del período',
    example: '2024-01-01T00:00:00.000Z',
  })
  periodStart: Date;

  @ApiProperty({
    description: 'Fecha de fin del período',
    example: '2024-03-31T23:59:59.999Z',
  })
  periodEnd: Date;

  @ApiProperty({ description: 'Si la meta está activa', example: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de actualización',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  constructor(
    id: number,
    name: string,
    description: string | null,
    metric: GoalMetric,
    targetValue: number,
    currentValue: number,
    progress: number,
    status: GoalStatus,
    periodStart: Date,
    periodEnd: Date,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.metric = metric;
    this.targetValue = targetValue;
    this.currentValue = currentValue;
    this.progress = progress;
    this.status = status;
    this.periodStart = periodStart;
    this.periodEnd = periodEnd;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GoalMetric } from '@libs/domain';

export class CreateGoalRequest {
  @ApiProperty({
    description: 'Nombre de la meta',
    example: 'Aumentar MRR en Q1 2024',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción de la meta',
    example: 'Meta para aumentar el MRR en un 20% durante el primer trimestre',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({
    description: 'Métrica a medir',
    enum: ['mrr', 'arr', 'activeSubscriptions', 'churnRate', 'retentionRate', 'newSubscriptions', 'upgrades'],
    example: 'mrr',
  })
  @IsEnum(['mrr', 'arr', 'activeSubscriptions', 'churnRate', 'retentionRate', 'newSubscriptions', 'upgrades'])
  metric: GoalMetric;

  @ApiProperty({
    description: 'Valor objetivo',
    example: 10000,
  })
  @IsNumber()
  @Min(0)
  targetValue: number;

  @ApiProperty({
    description: 'Fecha de inicio del período (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsString()
  periodStart: string;

  @ApiProperty({
    description: 'Fecha de fin del período (ISO 8601)',
    example: '2024-03-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsString()
  periodEnd: string;

  @ApiPropertyOptional({
    description: 'Si la meta está activa',
    example: true,
    default: true,
  })
  @IsOptional()
  isActive?: boolean;
}


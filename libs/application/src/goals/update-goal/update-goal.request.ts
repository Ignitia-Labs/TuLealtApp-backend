import { IsString, IsNumber, IsOptional, IsDateString, IsBoolean, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGoalRequest {
  @ApiPropertyOptional({
    description: 'ID de la meta',
    type: Number,
    example: 1,
  })
  goalId?: number;

  @ApiPropertyOptional({
    description: 'Nombre de la meta',
    example: 'Aumentar MRR en Q1 2024',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Descripción de la meta',
    example: 'Meta para aumentar el MRR en un 20% durante el primer trimestre',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Valor objetivo',
    example: 10000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  targetValue?: number;

  @ApiPropertyOptional({
    description: 'Fecha de inicio del período (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  @IsString()
  periodStart?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin del período (ISO 8601)',
    example: '2024-03-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  @IsString()
  periodEnd?: string;

  @ApiPropertyOptional({
    description: 'Si la meta está activa',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

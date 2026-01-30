import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO para validar IdempotencyScope
 * Define el alcance de idempotencia para evitar duplicados
 */
export class IdempotencyScopeDto {
  @ApiProperty({
    description: 'Estrategia de idempotencia',
    example: 'per-day',
    enum: ['default', 'per-day', 'per-period', 'per-event'],
  })
  @IsEnum(['default', 'per-day', 'per-period', 'per-event'])
  @IsNotEmpty()
  strategy: 'default' | 'per-day' | 'per-period' | 'per-event';

  @ApiPropertyOptional({
    description: 'Timezone para buckets (requerido para per-day y per-period)',
    example: 'America/Guatemala',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  bucketTimezone?: string | null;

  @ApiPropertyOptional({
    description: 'Días del periodo (requerido para per-period)',
    example: 30,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  periodDays?: number | null;
}

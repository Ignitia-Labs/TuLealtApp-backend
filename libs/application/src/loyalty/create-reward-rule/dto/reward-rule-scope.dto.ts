import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO para validar RewardRuleScope
 * Representa el alcance de aplicación de una regla de recompensa
 */
export class RewardRuleScopeDto {
  @ApiPropertyOptional({
    description: 'ID del tenant (se asigna automáticamente desde params)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tenantId?: number;

  @ApiPropertyOptional({
    description: 'ID del programa (se asigna automáticamente desde params)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  programId?: number;

  @ApiPropertyOptional({
    description: 'ID de la tienda (opcional)',
    example: 1,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  storeId?: number | null;

  @ApiPropertyOptional({
    description: 'ID de la sucursal (opcional)',
    example: 1,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  branchId?: number | null;

  @ApiPropertyOptional({
    description: 'Canal de aplicación (ej: "online", "in-store", "mobile")',
    example: 'in-store',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  channel?: string | null;

  @ApiPropertyOptional({
    description: 'ID de la categoría (opcional)',
    example: 1,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number | null;

  @ApiPropertyOptional({
    description: 'SKU específico (opcional)',
    example: 'SKU-12345',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  sku?: string | null;
}

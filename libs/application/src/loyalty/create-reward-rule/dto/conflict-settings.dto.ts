import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ConflictGroup, StackPolicy } from '@libs/domain';

/**
 * DTO para validar ConflictSettings
 * Define cómo se resuelven conflictos entre reglas que compiten
 */
export class ConflictSettingsDto {
  @ApiProperty({
    description: 'Grupo de conflicto (debe ser del catálogo)',
    example: 'CG_VISIT_DAILY',
    enum: [
      'CG_PURCHASE_BASE',
      'CG_PURCHASE_BONUS_FIXED',
      'CG_PURCHASE_BONUS_RATE',
      'CG_PURCHASE_CATEGORY',
      'CG_PURCHASE_SKU',
      'CG_PURCHASE_PROMO',
      'CG_VISIT_DAILY',
      'CG_VISIT_STREAK',
      'CG_SUB_START',
      'CG_SUB_RENEW',
      'CG_SUB_BONUS',
      'CG_REFERRAL_AWARD',
      'CG_RETENTION_PERIODIC',
    ],
  })
  @IsString()
  @IsNotEmpty()
  conflictGroup: ConflictGroup;

  @ApiProperty({
    description: 'Política de apilamiento',
    example: 'EXCLUSIVE',
    enum: ['STACK', 'EXCLUSIVE', 'BEST_OF', 'PRIORITY'],
  })
  @IsEnum(['STACK', 'EXCLUSIVE', 'BEST_OF', 'PRIORITY'])
  @IsNotEmpty()
  stackPolicy: StackPolicy;

  @ApiProperty({
    description: 'Rango de prioridad (mayor = mayor prioridad)',
    example: 1,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  priorityRank: number;

  @ApiPropertyOptional({
    description: 'Máximo de premios por evento en este conflictGroup',
    example: 1,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxAwardsPerEvent?: number | null;
}

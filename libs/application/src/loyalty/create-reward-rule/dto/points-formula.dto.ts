import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  Min,
  IsNumber,
  IsObject,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EligibilityConditions } from '@libs/domain';

/**
 * DTO base para fórmulas de puntos
 */
export class PointsFormulaBaseDto {
  @ApiProperty({
    description: 'Tipo de fórmula',
    enum: ['fixed', 'rate', 'table', 'hybrid'],
  })
  @IsEnum(['fixed', 'rate', 'table', 'hybrid'])
  @IsNotEmpty()
  type: 'fixed' | 'rate' | 'table' | 'hybrid';
}

/**
 * DTO para fórmula de puntos fijos
 */
export class FixedPointsFormulaDto extends PointsFormulaBaseDto {
  @ApiProperty({ example: 'fixed' })
  @IsEnum(['fixed'])
  @IsNotEmpty()
  type: 'fixed';

  @ApiProperty({
    description: 'Cantidad fija de puntos',
    example: 10,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  points: number;
}

/**
 * DTO para fórmula de puntos por tasa
 */
export class RatePointsFormulaDto extends PointsFormulaBaseDto {
  @ApiProperty({ example: 'rate' })
  @IsEnum(['rate'])
  @IsNotEmpty()
  type: 'rate';

  @ApiProperty({
    description: 'Tasa de puntos por unidad (ej: 1 punto por $1)',
    example: 1.0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  rate: number;

  @ApiProperty({
    description: 'Campo del evento a usar para calcular puntos',
    example: 'netAmount',
    enum: ['netAmount', 'grossAmount'],
  })
  @IsEnum(['netAmount', 'grossAmount'])
  @IsNotEmpty()
  amountField: 'netAmount' | 'grossAmount';

  @ApiProperty({
    description: 'Política de redondeo',
    example: 'floor',
    enum: ['floor', 'ceil', 'nearest'],
  })
  @IsEnum(['floor', 'ceil', 'nearest'])
  @IsNotEmpty()
  roundingPolicy: 'floor' | 'ceil' | 'nearest';

  @ApiPropertyOptional({
    description: 'Puntos mínimos (opcional)',
    example: 0,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPoints?: number | null;

  @ApiPropertyOptional({
    description: 'Puntos máximos (opcional)',
    example: 1000,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPoints?: number | null;
}

/**
 * DTO para entrada de tabla de puntos
 */
export class PointsTableEntryDto {
  @ApiProperty({
    description: 'Valor mínimo del rango',
    example: 0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  min: number;

  @ApiProperty({
    description: 'Valor máximo del rango (null = sin máximo)',
    example: 100,
    nullable: true,
  })
  @ValidateIf((o) => o.max !== null)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max: number | null;

  @ApiProperty({
    description: 'Puntos para este rango',
    example: 10,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  points: number;
}

/**
 * DTO para fórmula de puntos por tabla
 */
export class TablePointsFormulaDto extends PointsFormulaBaseDto {
  @ApiProperty({ example: 'table' })
  @IsEnum(['table'])
  @IsNotEmpty()
  type: 'table';

  @ApiProperty({
    description: 'Tabla de rangos y puntos',
    type: [PointsTableEntryDto],
    example: [
      { min: 0, max: 100, points: 10 },
      { min: 100, max: 500, points: 50 },
      { min: 500, max: null, points: 100 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PointsTableEntryDto)
  @IsNotEmpty()
  table: PointsTableEntryDto[];

  @ApiProperty({
    description: 'Campo del evento a usar para calcular puntos',
    example: 'netAmount',
    enum: ['netAmount', 'grossAmount'],
  })
  @IsEnum(['netAmount', 'grossAmount'])
  @IsNotEmpty()
  amountField: 'netAmount' | 'grossAmount';
}

/**
 * DTO para condición de bono en fórmula híbrida
 */
export class HybridBonusConditionDto {
  @ApiProperty({
    description: 'Condiciones de elegibilidad para el bono',
    type: Object,
    example: { minTierId: 2 },
  })
  @IsObject()
  @IsNotEmpty()
  condition: EligibilityConditions;

  @ApiProperty({
    description: 'Fórmula de bono (fixed o rate)',
    oneOf: [
      { $ref: '#/components/schemas/FixedPointsFormulaDto' },
      { $ref: '#/components/schemas/RatePointsFormulaDto' },
    ],
  })
  @ValidateNested()
  @Type(() => Object)
  @IsNotEmpty()
  bonus: FixedPointsFormulaDto | RatePointsFormulaDto;
}

/**
 * DTO para fórmula de puntos híbrida
 */
export class HybridPointsFormulaDto extends PointsFormulaBaseDto {
  @ApiProperty({ example: 'hybrid' })
  @IsEnum(['hybrid'])
  @IsNotEmpty()
  type: 'hybrid';

  @ApiProperty({
    description: 'Fórmula base (fixed o rate)',
    oneOf: [
      { $ref: '#/components/schemas/FixedPointsFormulaDto' },
      { $ref: '#/components/schemas/RatePointsFormulaDto' },
    ],
  })
  @ValidateNested()
  @Type(() => Object)
  @IsNotEmpty()
  base: FixedPointsFormulaDto | RatePointsFormulaDto;

  @ApiProperty({
    description: 'Bonos adicionales según condiciones',
    type: [HybridBonusConditionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HybridBonusConditionDto)
  @IsNotEmpty()
  bonuses: HybridBonusConditionDto[];
}

/**
 * Tipo union para todas las fórmulas de puntos
 */
export type PointsFormulaDto =
  | FixedPointsFormulaDto
  | RatePointsFormulaDto
  | TablePointsFormulaDto
  | HybridPointsFormulaDto;

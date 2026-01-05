import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  IsArray,
  ValidateIf,
  IsDateString,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO para horario aplicable
 */
class ApplicableHoursDto {
  @ApiProperty({
    description: 'Hora de inicio (formato HH:mm)',
    example: '09:00',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  start: string;

  @ApiProperty({
    description: 'Hora de fin (formato HH:mm)',
    example: '18:00',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  end: string;
}

/**
 * DTO de request para crear una regla de puntos
 */
export class CreatePointsRuleRequest {
  @ApiProperty({
    description: 'ID del tenant al que pertenece la regla',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  tenantId: number;

  @ApiProperty({
    description: 'Nombre de la regla de puntos',
    example: 'Puntos por compra',
    type: String,
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: 'Descripción detallada de la regla',
    example: 'Gana 1 punto por cada Q10.00 de compra',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Tipo de regla de puntos',
    example: 'purchase',
    enum: ['purchase', 'visit', 'referral', 'birthday', 'custom'],
    enumName: 'PointsRuleType',
  })
  @IsEnum(['purchase', 'visit', 'referral', 'birthday', 'custom'])
  @IsNotEmpty()
  type: 'purchase' | 'visit' | 'referral' | 'birthday' | 'custom';

  @ApiProperty({
    description: 'Puntos ganados por unidad (ej: puntos por cada Q1.00 de compra)',
    example: 0.1,
    type: Number,
    minimum: 0.01,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  pointsPerUnit: number;

  @ApiProperty({
    description: 'Monto mínimo requerido para aplicar la regla',
    example: 50.0,
    type: Number,
    minimum: 0,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  @ValidateIf((o) => o.minAmount !== null && o.minAmount !== undefined)
  @Min(0)
  minAmount?: number | null;

  @ApiProperty({
    description: 'Multiplicador de puntos (ej: 1.5 = 50% bonus). Debe ser >= 1.0',
    example: 1.2,
    type: Number,
    minimum: 1.0,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  @ValidateIf((o) => o.multiplier !== null && o.multiplier !== undefined)
  @Min(1.0)
  multiplier?: number | null;

  @ApiProperty({
    description:
      'Días de la semana aplicables (0=Domingo, 1=Lunes, ..., 6=Sábado). null = todos los días',
    example: [1, 2, 3, 4, 5],
    type: Number,
    isArray: true,
    required: false,
    nullable: true,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  applicableDays?: number[] | null;

  @ApiProperty({
    description: 'Horario aplicable de la regla',
    example: { start: '09:00', end: '18:00' },
    type: ApplicableHoursDto,
    required: false,
    nullable: true,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => ApplicableHoursDto)
  @IsOptional()
  applicableHours?: ApplicableHoursDto | null;

  @ApiProperty({
    description: 'Fecha de inicio de validez de la regla (ISO date)',
    example: '2024-01-01T00:00:00.000Z',
    type: String,
    required: false,
    nullable: true,
  })
  @IsDateString()
  @IsOptional()
  validFrom?: string | null;

  @ApiProperty({
    description: 'Fecha de fin de validez de la regla (ISO date)',
    example: '2024-12-31T23:59:59.999Z',
    type: String,
    required: false,
    nullable: true,
  })
  @IsDateString()
  @IsOptional()
  validUntil?: string | null;

  @ApiProperty({
    description: 'Estado de la regla',
    example: 'active',
    enum: ['active', 'inactive'],
    enumName: 'PointsRuleStatus',
    required: false,
    default: 'active',
  })
  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: 'active' | 'inactive';

  @ApiProperty({
    description: 'Prioridad de la regla (mayor número = mayor prioridad)',
    example: 1,
    type: Number,
    minimum: 1,
    required: false,
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  priority?: number;
}

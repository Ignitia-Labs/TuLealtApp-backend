import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO compartido para representar una regla de puntos
 * Se usa en múltiples responses
 */
export class PointsRuleDto {
  @ApiProperty({
    description: 'ID único de la regla de puntos',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID del tenant al que pertenece la regla',
    example: 1,
    type: Number,
  })
  tenantId: number;

  @ApiProperty({
    description: 'Nombre de la regla de puntos',
    example: 'Puntos por compra',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Descripción detallada de la regla',
    example: 'Gana 1 punto por cada Q10.00 de compra',
    type: String,
  })
  description: string;

  @ApiProperty({
    description: 'Tipo de regla de puntos',
    example: 'purchase',
    enum: ['purchase', 'visit', 'referral', 'birthday', 'custom'],
    enumName: 'PointsRuleType',
  })
  type: 'purchase' | 'visit' | 'referral' | 'birthday' | 'custom';

  @ApiProperty({
    description: 'Puntos ganados por unidad (ej: puntos por cada Q1.00 de compra)',
    example: 0.1,
    type: Number,
  })
  pointsPerUnit: number;

  @ApiProperty({
    description: 'Monto mínimo requerido para aplicar la regla (opcional)',
    example: 50.0,
    type: Number,
    nullable: true,
    required: false,
  })
  minAmount: number | null;

  @ApiProperty({
    description: 'Multiplicador de puntos (ej: 1.5 = 50% bonus)',
    example: 1.2,
    type: Number,
    nullable: true,
    required: false,
  })
  multiplier: number | null;

  @ApiProperty({
    description:
      'Días de la semana aplicables (0=Domingo, 1=Lunes, ..., 6=Sábado). null = todos los días',
    example: [1, 2, 3, 4, 5],
    type: Number,
    isArray: true,
    nullable: true,
    required: false,
  })
  applicableDays: number[] | null;

  @ApiProperty({
    description: 'Horario aplicable de la regla (formato HH:mm)',
    example: { start: '09:00', end: '18:00' },
    type: Object,
    nullable: true,
    required: false,
  })
  applicableHours: { start: string; end: string } | null;

  @ApiProperty({
    description: 'Fecha de inicio de validez de la regla (ISO date)',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
    nullable: true,
    required: false,
  })
  validFrom: Date | null;

  @ApiProperty({
    description: 'Fecha de fin de validez de la regla (ISO date)',
    example: '2024-12-31T23:59:59.999Z',
    type: Date,
    nullable: true,
    required: false,
  })
  validUntil: Date | null;

  @ApiProperty({
    description: 'Estado de la regla',
    example: 'active',
    enum: ['active', 'inactive'],
    enumName: 'PointsRuleStatus',
  })
  status: 'active' | 'inactive';

  @ApiProperty({
    description: 'Prioridad de la regla (mayor número = mayor prioridad)',
    example: 1,
    type: Number,
  })
  priority: number;

  @ApiProperty({
    description: 'Fecha de creación de la regla',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización de la regla',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(
    id: number,
    tenantId: number,
    name: string,
    description: string,
    type: 'purchase' | 'visit' | 'referral' | 'birthday' | 'custom',
    pointsPerUnit: number,
    minAmount: number | null,
    multiplier: number | null,
    applicableDays: number[] | null,
    applicableHours: { start: string; end: string } | null,
    validFrom: Date | null,
    validUntil: Date | null,
    status: 'active' | 'inactive',
    priority: number,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.tenantId = tenantId;
    this.name = name;
    this.description = description;
    this.type = type;
    this.pointsPerUnit = pointsPerUnit;
    this.minAmount = minAmount;
    this.multiplier = multiplier;
    this.applicableDays = applicableDays;
    this.applicableHours = applicableHours;
    this.validFrom = validFrom;
    this.validUntil = validUntil;
    this.status = status;
    this.priority = priority;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

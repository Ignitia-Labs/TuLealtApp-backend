import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO compartido para representar un nivel/tier de cliente
 * Se usa en múltiples responses
 */
export class CustomerTierDto {
  @ApiProperty({
    description: 'ID único del tier',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID del tenant al que pertenece el tier',
    example: 1,
    type: Number,
  })
  tenantId: number;

  @ApiProperty({
    description: 'Nombre del tier',
    example: 'Bronce',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Descripción del tier',
    example: 'Nivel inicial para nuevos clientes',
    type: String,
    nullable: true,
    required: false,
  })
  description: string | null;

  @ApiProperty({
    description: 'Puntos mínimos requeridos para este tier',
    example: 0,
    type: Number,
  })
  minPoints: number;

  @ApiProperty({
    description: 'Puntos máximos para este tier (null = sin límite superior, tier más alto)',
    example: 1000,
    type: Number,
    nullable: true,
    required: false,
  })
  maxPoints: number | null;

  @ApiProperty({
    description: 'Color del tier en formato hexadecimal',
    example: '#cd7f32',
    type: String,
  })
  color: string;

  @ApiProperty({
    description: 'Lista de beneficios del tier',
    example: ['Descuento del 5%', 'Envío gratis', 'Acceso a productos exclusivos'],
    type: String,
    isArray: true,
    nullable: true,
    required: false,
  })
  benefits: string[];

  @ApiProperty({
    description: 'Multiplicador de puntos (ej: 1.1 = 10% bonus)',
    example: 1.05,
    type: Number,
    nullable: true,
    required: false,
  })
  multiplier: number | null;

  @ApiProperty({
    description: 'Nombre del icono o URL del icono del tier',
    example: 'star',
    type: String,
    nullable: true,
    required: false,
  })
  icon: string | null;

  @ApiProperty({
    description: 'Prioridad del tier (menor número = más bajo, mayor número = más alto)',
    example: 1,
    type: Number,
  })
  priority: number;

  @ApiProperty({
    description: 'Estado del tier',
    example: 'active',
    enum: ['active', 'inactive'],
    enumName: 'CustomerTierStatus',
  })
  status: 'active' | 'inactive';

  @ApiProperty({
    description: 'Fecha de creación del tier',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del tier',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(
    id: number,
    tenantId: number,
    name: string,
    description: string | null,
    minPoints: number,
    maxPoints: number | null,
    color: string,
    benefits: string[],
    multiplier: number | null,
    icon: string | null,
    priority: number,
    status: 'active' | 'inactive',
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.tenantId = tenantId;
    this.name = name;
    this.description = description;
    this.minPoints = minPoints;
    this.maxPoints = maxPoints;
    this.color = color;
    this.benefits = benefits;
    this.multiplier = multiplier;
    this.icon = icon;
    this.priority = priority;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}


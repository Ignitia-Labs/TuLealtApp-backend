import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para obtener un código de invitación por su valor
 */
export class GetInvitationCodeByCodeResponse {
  @ApiProperty({
    description: 'ID del código de invitación',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Código de invitación',
    example: 'INV-ABC23456',
    type: String,
  })
  code: string;

  @ApiProperty({
    description: 'ID del tenant',
    example: 1,
    type: Number,
  })
  tenantId: number;

  @ApiProperty({
    description: 'ID de la branch (opcional)',
    example: 5,
    type: Number,
    nullable: true,
  })
  branchId: number | null;

  @ApiProperty({
    description: 'Tipo de código',
    example: 'text',
    enum: ['text', 'qr'],
  })
  type: 'text' | 'qr';

  @ApiProperty({
    description: 'Número máximo de usos permitidos',
    example: 10,
    type: Number,
    nullable: true,
  })
  maxUses: number | null;

  @ApiProperty({
    description: 'Número actual de usos',
    example: 3,
    type: Number,
  })
  currentUses: number;

  @ApiProperty({
    description: 'Fecha de expiración',
    example: '2024-12-31T23:59:59.000Z',
    type: Date,
    nullable: true,
  })
  expiresAt: Date | null;

  @ApiProperty({
    description: 'Estado del código',
    example: 'active',
    enum: ['active', 'expired', 'disabled'],
  })
  status: 'active' | 'expired' | 'disabled';

  @ApiProperty({
    description: 'ID del usuario que creó el código',
    example: 1,
    type: Number,
  })
  createdBy: number;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de actualización',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(
    id: number,
    code: string,
    tenantId: number,
    branchId: number | null,
    type: 'text' | 'qr',
    maxUses: number | null,
    currentUses: number,
    expiresAt: Date | null,
    status: 'active' | 'expired' | 'disabled',
    createdBy: number,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.code = code;
    this.tenantId = tenantId;
    this.branchId = branchId;
    this.type = type;
    this.maxUses = maxUses;
    this.currentUses = currentUses;
    this.expiresAt = expiresAt;
    this.status = status;
    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

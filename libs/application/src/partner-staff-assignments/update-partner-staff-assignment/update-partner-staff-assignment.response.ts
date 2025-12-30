import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO para actualizar una asignación staff-partner
 */
export class UpdatePartnerStaffAssignmentResponse {
  @ApiProperty({
    description: 'ID de la asignación',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID del partner',
    example: 1,
    type: Number,
  })
  partnerId: number;

  @ApiProperty({
    description: 'ID del usuario staff',
    example: 5,
    type: Number,
  })
  staffUserId: number;

  @ApiProperty({
    description: 'Porcentaje de comisión',
    example: 20.0,
    type: Number,
  })
  commissionPercent: number;

  @ApiProperty({
    description: 'Indica si la asignación está activa',
    example: true,
    type: Boolean,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de inicio',
    example: '2024-01-01T00:00:00Z',
    type: Date,
  })
  startDate: Date;

  @ApiProperty({
    description: 'Fecha de fin (null si no tiene fin)',
    example: '2024-12-31T23:59:59Z',
    type: Date,
    nullable: true,
  })
  endDate: Date | null;

  @ApiProperty({
    description: 'Notas adicionales',
    example: 'Actualización del porcentaje de comisión',
    type: String,
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'Fecha de actualización',
    example: '2024-01-15T00:00:00Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(
    id: number,
    partnerId: number,
    staffUserId: number,
    commissionPercent: number,
    isActive: boolean,
    startDate: Date,
    endDate: Date | null,
    notes: string | null,
    updatedAt: Date,
  ) {
    this.id = id;
    this.partnerId = partnerId;
    this.staffUserId = staffUserId;
    this.commissionPercent = commissionPercent;
    this.isActive = isActive;
    this.startDate = startDate;
    this.endDate = endDate;
    this.notes = notes;
    this.updatedAt = updatedAt;
  }
}


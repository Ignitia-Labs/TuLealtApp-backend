import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para una asignación staff-partner en la respuesta
 */
export class PartnerStaffAssignmentDto {
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
    description: 'Nombre del partner',
    example: 'Restaurante La Cocina',
    type: String,
  })
  partnerName: string;

  @ApiProperty({
    description: 'ID del usuario staff',
    example: 5,
    type: Number,
  })
  staffUserId: number;

  @ApiProperty({
    description: 'Nombre del usuario staff',
    example: 'Juan Pérez',
    type: String,
  })
  staffUserName: string;

  @ApiProperty({
    description: 'Email del usuario staff',
    example: 'juan.perez@example.com',
    type: String,
  })
  staffUserEmail: string;

  @ApiProperty({
    description: 'Porcentaje de comisión',
    example: 15.5,
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
    example: 'Asignación inicial',
    type: String,
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-01-01T00:00:00Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de actualización',
    example: '2024-01-15T00:00:00Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(
    id: number,
    partnerId: number,
    partnerName: string,
    staffUserId: number,
    staffUserName: string,
    staffUserEmail: string,
    commissionPercent: number,
    isActive: boolean,
    startDate: Date,
    endDate: Date | null,
    notes: string | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.partnerId = partnerId;
    this.partnerName = partnerName;
    this.staffUserId = staffUserId;
    this.staffUserName = staffUserName;
    this.staffUserEmail = staffUserEmail;
    this.commissionPercent = commissionPercent;
    this.isActive = isActive;
    this.startDate = startDate;
    this.endDate = endDate;
    this.notes = notes;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

/**
 * Response DTO para obtener asignaciones staff-partner
 */
export class GetPartnerStaffAssignmentsResponse {
  @ApiProperty({
    description: 'Lista de asignaciones',
    type: [PartnerStaffAssignmentDto],
  })
  assignments: PartnerStaffAssignmentDto[];

  @ApiProperty({
    description: 'Total de asignaciones',
    example: 10,
    type: Number,
  })
  total: number;

  constructor(assignments: PartnerStaffAssignmentDto[], total: number) {
    this.assignments = assignments;
    this.total = total;
  }
}


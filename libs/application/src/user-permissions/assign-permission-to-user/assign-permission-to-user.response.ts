import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para asignar un permiso directo a un usuario
 */
export class AssignPermissionToUserResponse {
  @ApiProperty({
    description: 'ID único de la asignación',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID del usuario',
    example: 10,
    type: Number,
  })
  userId: number;

  @ApiProperty({
    description: 'ID del permiso asignado',
    example: 5,
    type: Number,
  })
  permissionId: number;

  @ApiProperty({
    description: 'ID del usuario que asignó el permiso',
    example: 1,
    type: Number,
  })
  assignedBy: number;

  @ApiProperty({
    description: 'Fecha de asignación',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  assignedAt: Date;

  @ApiProperty({
    description: 'Indica si la asignación está activa',
    example: true,
    type: Boolean,
  })
  isActive: boolean;

  constructor(
    id: number,
    userId: number,
    permissionId: number,
    assignedBy: number,
    assignedAt: Date,
    isActive: boolean,
  ) {
    this.id = id;
    this.userId = userId;
    this.permissionId = permissionId;
    this.assignedBy = assignedBy;
    this.assignedAt = assignedAt;
    this.isActive = isActive;
  }
}

import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para asignar un perfil a un usuario
 */
export class AssignProfileToUserResponse {
  @ApiProperty({
    description: 'ID único de la asignación creada',
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
    description: 'ID del perfil asignado',
    example: 5,
    type: Number,
  })
  profileId: number;

  @ApiProperty({
    description: 'ID del usuario que realizó la asignación',
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
    profileId: number,
    assignedBy: number,
    assignedAt: Date,
    isActive: boolean,
  ) {
    this.id = id;
    this.userId = userId;
    this.profileId = profileId;
    this.assignedBy = assignedBy;
    this.assignedAt = assignedAt;
    this.isActive = isActive;
  }
}


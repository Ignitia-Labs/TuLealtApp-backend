import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para obtener el historial de cambios de un usuario
 */
export class UserChangeHistoryItem {
  @ApiProperty({
    description: 'ID del registro de historial',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID del usuario que fue modificado',
    example: 10,
    type: Number,
  })
  userId: number;

  @ApiProperty({
    description: 'ID del usuario que realizó el cambio',
    example: 1,
    type: Number,
  })
  changedBy: number;

  @ApiProperty({
    description: 'Tipo de acción realizada',
    example: 'updated',
    enum: [
      'created',
      'updated',
      'locked',
      'unlocked',
      'deleted',
      'profile_assigned',
      'profile_removed',
      'role_changed',
      'status_changed',
      'partner_assigned',
      'partner_removed',
    ],
  })
  action: string;

  @ApiProperty({
    description: 'Campo que fue modificado (null si es una acción general)',
    example: 'email',
    type: String,
    nullable: true,
  })
  field: string | null;

  @ApiProperty({
    description: 'Valor anterior del campo',
    example: 'old@example.com',
    type: String,
    nullable: true,
  })
  oldValue: string | null;

  @ApiProperty({
    description: 'Nuevo valor del campo',
    example: 'new@example.com',
    type: String,
    nullable: true,
  })
  newValue: string | null;

  @ApiProperty({
    description: 'Información adicional sobre el cambio',
    example: { reason: 'Email update requested by user' },
    type: Object,
    nullable: true,
  })
  metadata: Record<string, any> | null;

  @ApiProperty({
    description: 'Fecha y hora en que se registró el cambio',
    example: '2024-01-20T14:45:00.000Z',
    type: Date,
  })
  createdAt: Date;

  constructor(
    id: number,
    userId: number,
    changedBy: number,
    action: string,
    field: string | null,
    oldValue: string | null,
    newValue: string | null,
    metadata: Record<string, any> | null,
    createdAt: Date,
  ) {
    this.id = id;
    this.userId = userId;
    this.changedBy = changedBy;
    this.action = action;
    this.field = field;
    this.oldValue = oldValue;
    this.newValue = newValue;
    this.metadata = metadata;
    this.createdAt = createdAt;
  }
}

export class GetUserChangeHistoryResponse {
  @ApiProperty({
    description: 'Lista de registros de historial de cambios',
    type: UserChangeHistoryItem,
    isArray: true,
  })
  history: UserChangeHistoryItem[];

  @ApiProperty({
    description: 'Total de registros de historial para el usuario',
    example: 25,
    type: Number,
  })
  total: number;

  constructor(history: UserChangeHistoryItem[], total: number) {
    this.history = history;
    this.total = total;
  }
}

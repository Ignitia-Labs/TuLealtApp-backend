import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para eliminar un permiso
 */
export class DeletePermissionResponse {
  @ApiProperty({
    description: 'ID del permiso eliminado',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Permission deleted successfully',
    type: String,
  })
  message: string;

  constructor(id: number, message: string) {
    this.id = id;
    this.message = message;
  }
}

import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para eliminar una branch
 */
export class DeleteBranchResponse {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Branch deleted successfully',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'ID de la branch eliminada',
    example: 1,
    type: Number,
  })
  id: number;

  constructor(message: string, id: number) {
    this.message = message;
    this.id = id;
  }
}

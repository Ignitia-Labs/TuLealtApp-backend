import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para eliminar una regla de puntos
 */
export class DeletePointsRuleResponse {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Points rule deleted successfully',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'ID de la regla de puntos eliminada',
    example: 1,
    type: Number,
  })
  id: number;

  constructor(message: string, id: number) {
    this.message = message;
    this.id = id;
  }
}

import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para eliminar una recompensa
 */
export class DeleteRewardResponse {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Reward deleted successfully',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'ID de la recompensa eliminada',
    example: 1,
    type: Number,
  })
  id: number;

  constructor(message: string, id: number) {
    this.message = message;
    this.id = id;
  }
}

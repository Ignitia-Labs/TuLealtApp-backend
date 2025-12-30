import { ApiProperty } from '@nestjs/swagger';

export class DeleteGoalResponse {
  @ApiProperty({ description: 'ID de la meta eliminada', example: 1 })
  id: number;

  @ApiProperty({ description: 'Mensaje de confirmación', example: 'Goal deleted successfully' })
  message: string;

  constructor(id: number, message: string) {
    this.id = id;
    this.message = message;
  }
}


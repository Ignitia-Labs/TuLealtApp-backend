import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para eliminar un mensaje
 */
export class DeleteMessageResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Mensaje eliminado exitosamente' })
  message: string;

  constructor(success: boolean, message: string) {
    this.success = success;
    this.message = message;
  }
}

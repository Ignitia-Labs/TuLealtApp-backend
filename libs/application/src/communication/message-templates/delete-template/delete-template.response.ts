import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para eliminar una plantilla
 */
export class DeleteTemplateResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Plantilla eliminada exitosamente' })
  message: string;

  constructor(success: boolean, message: string) {
    this.success = success;
    this.message = message;
  }
}

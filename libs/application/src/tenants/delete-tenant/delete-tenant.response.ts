import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para eliminar un tenant
 */
export class DeleteTenantResponse {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Tenant deleted successfully',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'ID del tenant eliminado',
    example: 1,
    type: Number,
  })
  id: number;

  constructor(message: string, id: number) {
    this.message = message;
    this.id = id;
  }
}

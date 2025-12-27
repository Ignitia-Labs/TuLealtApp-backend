import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para eliminar un elemento de catálogo
 */
export class DeleteCatalogResponse {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Catalog deleted successfully',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'ID del elemento de catálogo eliminado',
    example: 1,
    type: Number,
  })
  id: number;

  constructor(message: string, id: number) {
    this.message = message;
    this.id = id;
  }
}


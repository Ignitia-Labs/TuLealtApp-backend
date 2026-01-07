import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para crear una consulta de contacto
 */
export class CreateContactInquiryResponse {
  @ApiProperty({
    description: 'ID único de la consulta',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Estado de la consulta',
    example: 'received',
    enum: ['received', 'processing', 'responded', 'closed'],
  })
  status: 'received' | 'processing' | 'responded' | 'closed';

  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Su consulta ha sido recibida exitosamente. Nos pondremos en contacto pronto.',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'Fecha de creación de la consulta',
    example: '2024-01-15T10:30:00.000Z',
    type: String,
  })
  createdAt: string;

  constructor(
    id: string,
    status: 'received' | 'processing' | 'responded' | 'closed',
    message: string,
    createdAt: Date,
  ) {
    this.id = id;
    this.status = status;
    this.message = message;
    this.createdAt = createdAt.toISOString();
  }
}

import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de Swagger para Country
 * Usado para documentar las respuestas de la API
 */
export class CountrySwaggerDto {
  @ApiProperty({
    description: 'ID único del país',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Nombre del país',
    example: 'Guatemala',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Código ISO de 2 letras del país',
    example: 'GT',
    type: String,
    nullable: true,
    required: false,
  })
  code: string | null;

  @ApiProperty({
    description: 'Código ISO de 3 letras de la moneda asociada',
    example: 'GTQ',
    type: String,
  })
  currencyCode: string;

  @ApiProperty({
    description: 'Código telefónico internacional del país',
    example: '+502',
    type: String,
    nullable: true,
    required: false,
  })
  countryCode: string | null;

  @ApiProperty({
    description: 'Estado del país',
    example: 'active',
    enum: ['active', 'inactive'],
    type: String,
  })
  status: 'active' | 'inactive';

  @ApiProperty({
    description: 'Fecha de creación del país',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del país',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  updatedAt: Date;
}

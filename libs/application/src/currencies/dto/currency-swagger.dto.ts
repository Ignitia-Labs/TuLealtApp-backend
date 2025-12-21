import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para documentación Swagger de Currency
 * Representa la estructura completa de una moneda para Swagger
 */
export class CurrencySwaggerDto {
  @ApiProperty({ example: 1, description: 'ID de la moneda' })
  id: number;

  @ApiProperty({
    example: 'USD',
    description: 'Código ISO de 3 letras de la moneda',
  })
  code: string;

  @ApiProperty({
    example: 'Dólar Estadounidense',
    description: 'Nombre completo de la moneda',
  })
  name: string;

  @ApiProperty({
    example: '$',
    description: 'Símbolo de la moneda',
  })
  symbol: string;

  @ApiProperty({
    example: 'before',
    description: 'Posición del símbolo (before o after)',
    enum: ['before', 'after'],
  })
  symbolPosition: 'before' | 'after';

  @ApiProperty({
    example: 2,
    description: 'Número de decimales',
  })
  decimalPlaces: number;

  @ApiProperty({
    example: 'active',
    description: 'Estado de la moneda',
    enum: ['active', 'inactive'],
  })
  status: 'active' | 'inactive';

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Fecha de creación',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Fecha de actualización',
    type: Date,
  })
  updatedAt: Date;
}

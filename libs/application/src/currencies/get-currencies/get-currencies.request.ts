import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener monedas
 */
export class GetCurrenciesRequest {
  @ApiProperty({
    description: 'Si se incluyen monedas inactivas',
    example: false,
    required: false,
    default: false,
  })
  includeInactive?: boolean;
}


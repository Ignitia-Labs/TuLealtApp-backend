import { ApiProperty } from '@nestjs/swagger';
import { RateExchange } from '@libs/domain';

/**
 * DTO de response para establecer/actualizar el tipo de cambio
 */
export class SetRateExchangeResponse {
  @ApiProperty({
    description: 'Tipo de cambio actualizado',
    example: {
      id: 1,
      rate: 7.85,
      fromCurrency: 'GTQ',
      toCurrency: 'USD',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  })
  rateExchange: RateExchange;

  @ApiProperty({
    description: 'Tasa de cambio (GTQ por USD)',
    example: 7.85,
  })
  rate: number;

  @ApiProperty({
    description: 'Moneda origen',
    example: 'GTQ',
  })
  fromCurrency: string;

  @ApiProperty({
    description: 'Moneda destino',
    example: 'USD',
  })
  toCurrency: string;

  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Rate exchange updated successfully',
  })
  message: string;

  constructor(rateExchange: RateExchange) {
    this.rateExchange = rateExchange;
    this.rate = rateExchange.rate;
    this.fromCurrency = rateExchange.fromCurrency;
    this.toCurrency = rateExchange.toCurrency;
    this.message = 'Rate exchange updated successfully';
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { RateExchange } from '@libs/domain';

/**
 * DTO de response para obtener el tipo de cambio
 */
export class GetRateExchangeResponse {
  @ApiProperty({
    description: 'Tipo de cambio actual',
    example: {
      id: 1,
      rate: 8,
      fromCurrency: 'GTQ',
      toCurrency: 'USD',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  })
  rateExchange: RateExchange;

  @ApiProperty({
    description: 'Tasa de cambio (GTQ por USD)',
    example: 8,
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

  constructor(rateExchange: RateExchange) {
    this.rateExchange = rateExchange;
    this.rate = rateExchange.rate;
    this.fromCurrency = rateExchange.fromCurrency;
    this.toCurrency = rateExchange.toCurrency;
  }
}

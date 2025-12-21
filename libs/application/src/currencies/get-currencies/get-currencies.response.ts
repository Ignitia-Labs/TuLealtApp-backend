import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '@libs/domain';
import { CurrencySwaggerDto } from '../dto/currency-swagger.dto';

/**
 * DTO de response para obtener monedas
 */
export class GetCurrenciesResponse {
  @ApiProperty({
    description: 'Lista de monedas',
    type: CurrencySwaggerDto,
    isArray: true,
    example: [
      {
        id: 1,
        code: 'USD',
        name: 'Dólar Estadounidense',
        symbol: '$',
        symbolPosition: 'before',
        decimalPlaces: 2,
        status: 'active',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ],
  })
  currencies: Currency[];

  constructor(currencies: Currency[]) {
    this.currencies = currencies;
  }
}

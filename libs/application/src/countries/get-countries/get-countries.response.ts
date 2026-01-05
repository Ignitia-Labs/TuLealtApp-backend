import { ApiProperty } from '@nestjs/swagger';
import { Country } from '@libs/domain';
import { CountrySwaggerDto } from '../dto/country-swagger.dto';

/**
 * DTO de response para obtener países
 */
export class GetCountriesResponse {
  @ApiProperty({
    description: 'Lista de países',
    type: CountrySwaggerDto,
    isArray: true,
    example: [
      {
        id: 1,
        name: 'Guatemala',
        code: 'GT',
        currencyCode: 'GTQ',
        status: 'active',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
      {
        id: 2,
        name: 'Estados Unidos',
        code: 'US',
        currencyCode: 'USD',
        status: 'active',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    ],
  })
  countries: Country[];

  constructor(countries: Country[]) {
    this.countries = countries;
  }
}

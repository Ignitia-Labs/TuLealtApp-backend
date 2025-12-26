import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import {
  GetCurrenciesHandler,
  GetCurrenciesRequest,
  GetCurrenciesResponse,
  GetCountriesHandler,
  GetCountriesRequest,
  GetCountriesResponse,
} from '@libs/application';

/**
 * Controlador de currencies para Admin API
 * Permite obtener las monedas disponibles en el sistema
 *
 * Endpoints:
 * - GET /admin/currencies - Obtener todas las monedas
 */
@ApiTags('Currencies')
@Controller('currencies')
export class CurrenciesController {
  constructor(
    private readonly getCurrenciesHandler: GetCurrenciesHandler,
    private readonly getCountriesHandler: GetCountriesHandler,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todas las monedas',
    description:
      'Obtiene la lista completa de monedas disponibles. Por defecto solo devuelve monedas activas.',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Incluir monedas inactivas',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de monedas obtenida exitosamente',
    type: GetCurrenciesResponse,
    example: {
      currencies: [
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
        {
          id: 8,
          code: 'GTQ',
          name: 'Quetzal Guatemalteco',
          symbol: 'Q',
          symbolPosition: 'before',
          decimalPlaces: 2,
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    },
  })
  async getCurrencies(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<GetCurrenciesResponse> {
    const request = new GetCurrenciesRequest();
    request.includeInactive = includeInactive === 'true';
    return this.getCurrenciesHandler.execute(request);
  }

  @Get('countries')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todos los países',
    description:
      'Obtiene la lista completa de países disponibles. Por defecto solo devuelve países activos.',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Incluir países inactivos',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de países obtenida exitosamente',
    type: GetCountriesResponse,
    example: {
      countries: [
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
        {
          id: 3,
          name: 'México',
          code: 'MX',
          currencyCode: 'MXN',
          status: 'active',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error del servidor',
    example: {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    },
  })
  async getCountries(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<GetCountriesResponse> {
    const request = new GetCountriesRequest();
    request.includeInactive = includeInactive === 'true';
    return this.getCountriesHandler.execute(request);
  }
}

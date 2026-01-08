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
import {
  BadRequestErrorResponseDto,
  InternalServerErrorResponseDto,
} from '@libs/shared';

/**
 * Controlador de currencies y countries para Partner API
 * Permite obtener las monedas y países disponibles en el sistema (solo lectura)
 * Endpoints públicos - No requieren autenticación
 *
 * Endpoints:
 * - GET /partner/currencies - Obtener todas las monedas
 * - GET /partner/currencies/countries - Obtener todos los países
 */
@ApiTags('Currencies & Countries')
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
      'Obtiene la lista completa de monedas disponibles. Por defecto solo devuelve monedas activas. Solo lectura. Endpoint público - No requiere autenticación.',
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
          countryId: null,
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
          countryId: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['includeInactive must be a boolean value'],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
    example: {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
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
      'Obtiene la lista completa de países disponibles. Por defecto solo devuelve países activos. Solo lectura. Endpoint público - No requiere autenticación.',
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
          countryCode: '+502',
          status: 'active',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
        {
          id: 2,
          name: 'Estados Unidos',
          code: 'US',
          currencyCode: 'USD',
          countryCode: '+1',
          status: 'active',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
        {
          id: 3,
          name: 'México',
          code: 'MX',
          currencyCode: 'MXN',
          countryCode: '+52',
          status: 'active',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['includeInactive must be a boolean value'],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
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

import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import {
  GetCurrenciesHandler,
  GetCurrenciesRequest,
  GetCurrenciesResponse,
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
  constructor(private readonly getCurrenciesHandler: GetCurrenciesHandler) {}

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
}

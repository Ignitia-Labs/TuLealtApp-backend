import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import {
  GetRateExchangeHandler,
  GetRateExchangeRequest,
  GetRateExchangeResponse,
} from '@libs/application';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  InternalServerErrorResponseDto,
} from '@libs/shared';

/**
 * Controlador de tipo de cambio para Partner API
 * Permite consultar el tipo de cambio entre GTQ y USD (solo lectura)
 *
 * Endpoints:
 * - GET /partner/pricing/rate-exchange - Obtener el tipo de cambio actual
 */
@ApiTags('Rate Exchange')
@Controller('pricing/rate-exchange')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PARTNER', 'PARTNER_STAFF', 'ADMIN', 'ADMIN_STAFF')
@ApiBearerAuth('JWT-auth')
export class RateExchangeController {
  constructor(private readonly getRateExchangeHandler: GetRateExchangeHandler) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener el tipo de cambio actual',
    description:
      'Obtiene el tipo de cambio más reciente entre GTQ y USD. Solo lectura. Para modificar el tipo de cambio, usar admin-api.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tipo de cambio obtenido exitosamente',
    type: GetRateExchangeResponse,
    example: {
      rateExchange: {
        id: 1,
        rate: 8,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Tipo de cambio no configurado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Rate exchange not found. Please configure the exchange rate first.',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para acceder a este recurso',
    type: ForbiddenErrorResponseDto,
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
  async getRateExchange(): Promise<GetRateExchangeResponse> {
    const request = new GetRateExchangeRequest();
    return this.getRateExchangeHandler.execute(request);
  }
}

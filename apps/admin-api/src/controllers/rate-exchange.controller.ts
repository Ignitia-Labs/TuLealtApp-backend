import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  GetRateExchangeHandler,
  GetRateExchangeRequest,
  GetRateExchangeResponse,
  SetRateExchangeHandler,
  SetRateExchangeRequest,
  SetRateExchangeResponse,
} from '@libs/application';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  BadRequestErrorResponseDto,
} from '@libs/shared';

/**
 * Controlador de tipo de cambio para Admin API
 * Permite gestionar el tipo de cambio entre GTQ y USD
 *
 * Endpoints:
 * - GET /admin/pricing/rate-exchange - Obtener el tipo de cambio actual
 * - POST /admin/pricing/rate-exchange - Establecer/actualizar el tipo de cambio
 */
@ApiTags('Admin Rate Exchange')
@Controller('admin/pricing/rate-exchange')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class RateExchangeController {
  constructor(
    private readonly getRateExchangeHandler: GetRateExchangeHandler,
    private readonly setRateExchangeHandler: SetRateExchangeHandler,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener el tipo de cambio actual',
    description: 'Obtiene el tipo de cambio más reciente entre GTQ y USD.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tipo de cambio obtenido exitosamente',
    type: GetRateExchangeResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Tipo de cambio no configurado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos de administrador',
    type: ForbiddenErrorResponseDto,
  })
  async getRateExchange(): Promise<GetRateExchangeResponse> {
    const request = new GetRateExchangeRequest();
    return this.getRateExchangeHandler.execute(request);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Establecer/actualizar el tipo de cambio',
    description:
      'Establece o actualiza el tipo de cambio entre GTQ y USD. Si ya existe un registro, lo actualiza; si no existe, crea uno nuevo.',
  })
  @ApiBody({
    type: SetRateExchangeRequest,
    description: 'Datos del tipo de cambio a establecer',
  })
  @ApiResponse({
    status: 200,
    description: 'Tipo de cambio actualizado exitosamente',
    type: SetRateExchangeResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos de administrador',
    type: ForbiddenErrorResponseDto,
  })
  async setRateExchange(
    @Body() request: SetRateExchangeRequest,
  ): Promise<SetRateExchangeResponse> {
    return this.setRateExchangeHandler.execute(request);
  }
}


import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  GetPartnerLimitsHandler,
  GetPartnerLimitsRequest,
  GetPartnerLimitsResponse,
} from '@libs/application';
import {
  BadRequestErrorResponseDto,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  InternalServerErrorResponseDto,
  JwtAuthGuard,
} from '@libs/shared';

/**
 * Controlador de límites de partners para Admin API
 * Permite obtener los límites de recursos de los partners
 *
 * NOTA: Los límites ahora se obtienen desde pricing_plan_limits y no se pueden actualizar directamente.
 * Para cambiar los límites de un partner, se debe cambiar su plan de suscripción.
 *
 * Endpoints:
 * - GET /admin/partner-limits/:partnerId - Obtener límites de un partner (desde pricing_plan_limits)
 */
@ApiTags('Partner Limits')
@Controller('partner-limits')
export class PartnerLimitsController {
  constructor(
    private readonly getPartnerLimitsHandler: GetPartnerLimitsHandler,
  ) {}

  @Get(':partnerId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener límites de un partner',
    description:
      'Obtiene los límites de recursos (tenants, branches, customers, rewards) configurados para un partner específico.',
  })
  @ApiParam({
    name: 'partnerId',
    description: 'ID único del partner',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Límites del partner obtenidos exitosamente',
    type: GetPartnerLimitsResponse,
    example: {
      id: 1,
      partnerId: 1,
      limits: {
        maxTenants: 5,
        maxBranches: 20,
        maxCustomers: 5000,
        maxRewards: 50,
        maxAdmins: -1,
        storageGB: -1,
        apiCallsPerMonth: -1,
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'ID de partner inválido',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['partnerId must be a positive number'],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos de administrador',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Partner o límites no encontrados',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Limits for partner with ID 1 not found',
      error: 'Not Found',
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
  async getPartnerLimits(
    @Param('partnerId', ParseIntPipe) partnerId: number,
  ): Promise<GetPartnerLimitsResponse> {
    const request = new GetPartnerLimitsRequest();
    request.partnerId = partnerId;
    return this.getPartnerLimitsHandler.execute(request);
  }

}

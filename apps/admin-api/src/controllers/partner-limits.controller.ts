import {
  Controller,
  Get,
  Patch,
  Body,
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
  UpdatePartnerLimitsHandler,
  UpdatePartnerLimitsRequest,
  UpdatePartnerLimitsResponse,
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
 * Permite gestionar los límites de recursos de los partners
 *
 * Endpoints:
 * - GET /admin/partner-limits/:partnerId - Obtener límites de un partner
 * - PATCH /admin/partner-limits/:partnerId - Actualizar límites de un partner (actualización parcial)
 */
@ApiTags('Partner Limits')
@Controller('partner-limits')
export class PartnerLimitsController {
  constructor(
    private readonly getPartnerLimitsHandler: GetPartnerLimitsHandler,
    private readonly updatePartnerLimitsHandler: UpdatePartnerLimitsHandler,
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

  @Patch(':partnerId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar límites de un partner',
    description:
      'Actualiza los límites de recursos de un partner. Todos los campos son opcionales, solo se actualizarán los campos enviados (actualización parcial PATCH).',
  })
  @ApiParam({
    name: 'partnerId',
    description: 'ID único del partner',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiBody({
    type: UpdatePartnerLimitsRequest,
    description: 'Límites a actualizar (todos los campos son opcionales)',
    examples: {
      ejemplo1: {
        summary: 'Actualizar solo maxTenants y maxBranches',
        description: 'Ejemplo de actualización parcial de solo algunos límites',
        value: {
          maxTenants: 10,
          maxBranches: 50,
        },
      },
      ejemplo2: {
        summary: 'Actualizar todos los límites',
        description: 'Ejemplo de actualización de todos los límites del partner',
        value: {
          maxTenants: 10,
          maxBranches: 50,
          maxCustomers: 10000,
          maxRewards: 100,
        },
      },
      ejemplo3: {
        summary: 'Aumentar límite de clientes',
        description: 'Ejemplo de aumento del límite de clientes permitidos',
        value: {
          maxCustomers: 20000,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Límites del partner actualizados exitosamente',
    type: UpdatePartnerLimitsResponse,
    example: {
      id: 1,
      partnerId: 1,
      limits: {
        maxTenants: 10,
        maxBranches: 50,
        maxCustomers: 10000,
        maxRewards: 100,
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o ningún campo proporcionado',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: [
        'At least one limit field must be provided for update',
        'maxTenants must be a positive number',
        'maxBranches must be a positive number',
      ],
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
  async updatePartnerLimits(
    @Param('partnerId', ParseIntPipe) partnerId: number,
    @Body() request: UpdatePartnerLimitsRequest,
  ): Promise<UpdatePartnerLimitsResponse> {
    return this.updatePartnerLimitsHandler.execute(partnerId, request);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
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
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CreateRewardHandler,
  CreateRewardRequest,
  CreateRewardResponse,
  GetRewardsHandler,
  GetRewardsRequest,
  GetRewardsResponse,
  GetRewardHandler,
  GetRewardRequest,
  GetRewardResponse,
} from '@libs/application';
import {
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  BadRequestErrorResponseDto,
  NotFoundErrorResponseDto,
  InternalServerErrorResponseDto,
} from '@libs/shared';
import { JwtAuthGuard, RolesGuard, Roles } from '@libs/shared';

/**
 * Controlador de Rewards para Admin API
 * Permite gestionar recompensas del sistema
 *
 * Endpoints:
 * - GET /admin/rewards - Obtener todas las recompensas
 * - POST /admin/rewards - Crear una nueva recompensa
 * - GET /admin/rewards/:id - Obtener recompensa por ID
 */
@ApiTags('Rewards')
@Controller('rewards')
export class RewardsController {
  constructor(
    private readonly createRewardHandler: CreateRewardHandler,
    private readonly getRewardsHandler: GetRewardsHandler,
    private readonly getRewardHandler: GetRewardHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear una nueva recompensa',
    description: 'Crea una nueva recompensa en el sistema. Requiere permisos de administrador.',
  })
  @ApiBody({
    type: CreateRewardRequest,
    description: 'Datos de la recompensa a crear',
    examples: {
      ejemplo1: {
        summary: 'Recompensa básica',
        description: 'Ejemplo de creación de recompensa con datos mínimos',
        value: {
          tenantId: 1,
          name: 'Descuento del 20%',
          description: 'Obtén un descuento del 20% en tu próxima compra',
          pointsRequired: 500,
          stock: 100,
          category: 'Descuentos',
        },
      },
      ejemplo2: {
        summary: 'Recompensa completa',
        description: 'Ejemplo de creación de recompensa con todos los campos',
        value: {
          tenantId: 1,
          name: 'Producto gratis',
          description: 'Obtén un producto gratis al canjear esta recompensa',
          pointsRequired: 1000,
          stock: 50,
          category: 'Productos',
          image: 'https://example.com/reward-image.jpg',
          maxRedemptionsPerUser: 1,
          terms: 'Válido hasta fin de mes. No acumulable con otras promociones.',
          validUntil: '2024-12-31T23:59:59Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Recompensa creada exitosamente',
    type: CreateRewardResponse,
    example: {
      id: 1,
      tenantId: 1,
      name: 'Descuento del 20%',
      description: 'Obtén un descuento del 20% en tu próxima compra',
      image: 'https://example.com/reward-image.jpg',
      pointsRequired: 500,
      stock: 100,
      maxRedemptionsPerUser: 1,
      status: 'active',
      category: 'Descuentos',
      terms: 'Válido hasta fin de mes',
      validUntil: '2024-12-31T23:59:59Z',
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: [
        'tenantId must be a number',
        'name should not be empty',
        'pointsRequired must be greater than or equal to 1',
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
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
    example: {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    },
  })
  async createReward(@Body() request: CreateRewardRequest): Promise<CreateRewardResponse> {
    return this.createRewardHandler.execute(request);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener todas las recompensas',
    description:
      'Obtiene la lista de recompensas de un tenant. Permite filtrar por categoría y solo mostrar disponibles.',
  })
  @ApiQuery({
    name: 'tenantId',
    required: true,
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Categoría para filtrar',
    example: 'Descuentos',
  })
  @ApiQuery({
    name: 'availableOnly',
    required: false,
    type: Boolean,
    description: 'Solo mostrar recompensas disponibles',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de recompensas obtenida exitosamente',
    type: GetRewardsResponse,
    example: {
      rewards: [
        {
          id: 1,
          tenantId: 1,
          name: 'Descuento del 20%',
          description: 'Obtén un descuento del 20% en tu próxima compra',
          image: 'https://example.com/reward-image.jpg',
          pointsRequired: 500,
          stock: 100,
          maxRedemptionsPerUser: 1,
          status: 'active',
          category: 'Descuentos',
          terms: 'Válido hasta fin de mes',
          validUntil: '2024-12-31T23:59:59Z',
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
      message: ['tenantId must be a number', 'tenantId must be greater than or equal to 1'],
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
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
    example: {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    },
  })
  async getRewards(
    @Query('tenantId', ParseIntPipe) tenantId: number,
    @Query('category') category?: string,
    @Query('availableOnly') availableOnly?: string | boolean,
  ): Promise<GetRewardsResponse> {
    const request = new GetRewardsRequest();
    request.tenantId = tenantId;
    request.category = category;
    request.availableOnly =
      availableOnly === true || availableOnly === 'true' || availableOnly === '1';
    return this.getRewardsHandler.execute(request);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener una recompensa por ID',
    description: 'Obtiene los detalles de una recompensa específica por su ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la recompensa',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Recompensa encontrada',
    type: GetRewardResponse,
    example: {
      id: 1,
      tenantId: 1,
      name: 'Descuento del 20%',
      description: 'Obtén un descuento del 20% en tu próxima compra',
      image: 'https://example.com/reward-image.jpg',
      pointsRequired: 500,
      stock: 100,
      maxRedemptionsPerUser: 1,
      status: 'active',
      category: 'Descuentos',
      terms: 'Válido hasta fin de mes',
      validUntil: '2024-12-31T23:59:59Z',
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Recompensa no encontrada',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Reward with ID 1 not found',
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
    description: 'No tiene permisos de administrador',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
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
  async getReward(@Param('id', ParseIntPipe) id: number): Promise<GetRewardResponse> {
    const request = new GetRewardRequest();
    request.rewardId = id;
    return this.getRewardHandler.execute(request);
  }
}

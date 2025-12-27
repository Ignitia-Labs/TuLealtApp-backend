import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
  CreateSubscriptionHandler,
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  GetSubscriptionHandler,
  GetSubscriptionRequest,
  GetSubscriptionResponse,
  GetSubscriptionsHandler,
  GetSubscriptionsRequest,
  GetSubscriptionsResponse,
  UpdateSubscriptionHandler,
  UpdateSubscriptionRequest,
  UpdateSubscriptionResponse,
  DeleteSubscriptionHandler,
  DeleteSubscriptionRequest,
  DeleteSubscriptionResponse,
} from '@libs/application';
import {
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  BadRequestErrorResponseDto,
  NotFoundErrorResponseDto,
  InternalServerErrorResponseDto,
  JwtAuthGuard,
} from '@libs/shared';

/**
 * Controlador de suscripciones para Admin API
 * Permite gestionar suscripciones de partners
 *
 * Endpoints:
 * - GET /admin/subscriptions - Obtener todas las suscripciones
 * - POST /admin/subscriptions - Crear una nueva suscripción
 * - GET /admin/subscriptions/:id - Obtener suscripción por ID
 * - PATCH /admin/subscriptions/:id - Actualizar suscripción
 * - DELETE /admin/subscriptions/:id - Eliminar suscripción
 */
@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly createSubscriptionHandler: CreateSubscriptionHandler,
    private readonly getSubscriptionHandler: GetSubscriptionHandler,
    private readonly getSubscriptionsHandler: GetSubscriptionsHandler,
    private readonly updateSubscriptionHandler: UpdateSubscriptionHandler,
    private readonly deleteSubscriptionHandler: DeleteSubscriptionHandler,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener todas las suscripciones',
    description: 'Obtiene una lista paginada de todas las suscripciones con filtros opcionales',
  })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    type: Number,
    description: 'Filtrar por ID de partner',
    example: 1,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'expired', 'suspended', 'cancelled', 'trialing', 'past_due', 'paused'],
    description: 'Filtrar por estado',
    example: 'active',
  })
  @ApiQuery({
    name: 'planType',
    required: false,
    enum: ['esencia', 'conecta', 'inspira'],
    description: 'Filtrar por tipo de plan',
    example: 'conecta',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página. Si no se proporciona junto con limit, retorna todos los resultados sin paginación',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de elementos por página. Si no se proporciona junto con page, retorna todos los resultados sin paginación',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de suscripciones obtenida exitosamente',
    type: GetSubscriptionsResponse,
    example: {
      subscriptions: [
        {
          id: 1,
          partnerId: 1,
          planId: 1,
          planSlug: 'conecta',
          planType: 'conecta',
          status: 'active',
          startDate: '2024-01-01T00:00:00.000Z',
          renewalDate: '2025-01-01T00:00:00.000Z',
          billingFrequency: 'monthly',
          billingAmount: 79.99,
          currency: 'USD',
          nextBillingDate: '2024-02-01T00:00:00.000Z',
          nextBillingAmount: 79.99,
          currentPeriodStart: '2024-01-01T00:00:00.000Z',
          currentPeriodEnd: '2024-02-01T00:00:00.000Z',
          trialEndDate: null,
          pausedAt: null,
          pauseReason: null,
          gracePeriodDays: 7,
          retryAttempts: 0,
          maxRetryAttempts: 3,
          creditBalance: 0,
          discountPercent: null,
          discountCode: null,
          lastPaymentDate: null,
          lastPaymentAmount: null,
          paymentStatus: null,
          autoRenew: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['page must be a positive number', 'limit must be a positive number'],
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
    description: 'Sin permisos',
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
  async getSubscriptions(
    @Query() query: GetSubscriptionsRequest,
  ): Promise<GetSubscriptionsResponse> {
    return this.getSubscriptionsHandler.execute(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear una nueva suscripción',
    description: 'Crea una nueva suscripción para un partner',
  })
  @ApiBody({
    type: CreateSubscriptionRequest,
    description: 'Datos de la suscripción a crear',
  })
  @ApiResponse({
    status: 201,
    description: 'Suscripción creada exitosamente',
    type: CreateSubscriptionResponse,
    example: {
      id: 1,
      partnerId: 1,
      planId: 1,
      planSlug: 'conecta',
      planType: 'conecta',
      status: 'active',
      startDate: '2024-01-01T00:00:00.000Z',
      renewalDate: '2025-01-01T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: [
        'partnerId must be a positive number',
        'planId should not be empty',
        'billingAmount must be a positive number',
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
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 409,
    description: 'El partner ya tiene una suscripción activa',
    example: {
      statusCode: 409,
      message: 'Partner already has an active subscription',
      error: 'Conflict',
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
  async createSubscription(
    @Body() request: CreateSubscriptionRequest,
  ): Promise<CreateSubscriptionResponse> {
    return this.createSubscriptionHandler.execute(request);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener suscripción por ID',
    description: 'Obtiene los detalles de una suscripción específica',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la suscripción',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Suscripción encontrada',
    type: GetSubscriptionResponse,
    example: {
      id: 1,
      partnerId: 1,
      planId: 1,
      planSlug: 'conecta',
      planType: 'conecta',
      status: 'active',
      startDate: '2024-01-01T00:00:00.000Z',
      renewalDate: '2025-01-01T00:00:00.000Z',
      billingFrequency: 'monthly',
      billingAmount: 79.99,
      currency: 'USD',
      nextBillingDate: '2024-02-01T00:00:00.000Z',
      nextBillingAmount: 79.99,
      currentPeriodStart: '2024-01-01T00:00:00.000Z',
      currentPeriodEnd: '2024-02-01T00:00:00.000Z',
      trialEndDate: null,
      pausedAt: null,
      pauseReason: null,
      gracePeriodDays: 7,
      retryAttempts: 0,
      maxRetryAttempts: 3,
      creditBalance: 0,
      discountPercent: null,
      discountCode: null,
      lastPaymentDate: null,
      lastPaymentAmount: null,
      paymentStatus: null,
      autoRenew: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Suscripción no encontrada',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Subscription with ID 1 not found',
      error: 'Not Found',
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
    description: 'Sin permisos',
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
  async getSubscription(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GetSubscriptionResponse> {
    const request = new GetSubscriptionRequest();
    request.subscriptionId = id;
    return this.getSubscriptionHandler.execute(request);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar suscripción',
    description: 'Actualiza una suscripción existente (actualización parcial)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la suscripción',
    type: Number,
    example: 1,
  })
  @ApiBody({
    type: UpdateSubscriptionRequest,
    description: 'Datos a actualizar',
  })
  @ApiResponse({
    status: 200,
    description: 'Suscripción actualizada exitosamente',
    type: UpdateSubscriptionResponse,
    example: {
      id: 1,
      status: 'active',
      updatedAt: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['billingAmount must be a positive number', 'status must be a valid enum value'],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Suscripción no encontrada',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Subscription with ID 1 not found',
      error: 'Not Found',
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
    description: 'Sin permisos',
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
  async updateSubscription(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateSubscriptionRequest,
  ): Promise<UpdateSubscriptionResponse> {
    request.subscriptionId = id;
    return this.updateSubscriptionHandler.execute(request);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Eliminar suscripción',
    description: 'Elimina una suscripción del sistema',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la suscripción',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Suscripción eliminada exitosamente',
    type: DeleteSubscriptionResponse,
    example: {
      id: 1,
      message: 'Subscription deleted successfully',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Suscripción no encontrada',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Subscription with ID 1 not found',
      error: 'Not Found',
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
    description: 'Sin permisos',
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
  async deleteSubscription(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteSubscriptionResponse> {
    const request = new DeleteSubscriptionRequest();
    request.subscriptionId = id;
    return this.deleteSubscriptionHandler.execute(request);
  }
}


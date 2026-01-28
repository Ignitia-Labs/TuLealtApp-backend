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
  GetSubscriptionStatsHandler,
  GetSubscriptionStatsRequest,
  SubscriptionStatsResponse,
  GetSubscriptionEventsHandler,
  GetSubscriptionEventsRequest,
  GetSubscriptionEventsResponse,
  GetSubscriptionEventsByIdRequest,
  GetSubscriptionStatsCompareHandler,
  GetSubscriptionStatsCompareRequest,
  GetSubscriptionStatsCompareResponse,
  GetSubscriptionTimeseriesHandler,
  GetSubscriptionTimeseriesRequest,
  GetSubscriptionTimeseriesResponse,
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
    private readonly getSubscriptionStatsHandler: GetSubscriptionStatsHandler,
    private readonly getSubscriptionEventsHandler: GetSubscriptionEventsHandler,
    private readonly getSubscriptionStatsCompareHandler: GetSubscriptionStatsCompareHandler,
    private readonly getSubscriptionTimeseriesHandler: GetSubscriptionTimeseriesHandler,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
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
    description:
      'Número de página. Si no se proporciona junto con limit, retorna todos los resultados sin paginación',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description:
      'Cantidad de elementos por página. Si no se proporciona junto con page, retorna todos los resultados sin paginación',
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
          includeTax: false,
          taxPercent: null,
          basePrice: 79.99,
          taxAmount: 0,
          totalPrice: 79.99,
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
  @ApiBearerAuth('JWT-auth')
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

  @Post(':id/events')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener eventos de una suscripción específica',
    description:
      'Obtiene una lista paginada de eventos de una suscripción específica con filtros opcionales. Las fechas deben estar en formato YYYY-MM-DD (ej: 2024-01-01)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la suscripción',
    type: Number,
    example: 1,
  })
  @ApiBody({
    type: GetSubscriptionEventsByIdRequest,
    description: 'Filtros para obtener eventos de la suscripción',
  })
  @ApiResponse({
    status: 200,
    description: 'Eventos obtenidos exitosamente',
    type: GetSubscriptionEventsResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros inválidos',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Suscripción no encontrada',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getEventsBySubscriptionId(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: GetSubscriptionEventsByIdRequest,
  ): Promise<GetSubscriptionEventsResponse> {
    // Crear un request del tipo original y asignar el subscriptionId del parámetro de ruta
    const request = new GetSubscriptionEventsRequest();
    request.subscriptionId = id;
    request.startDate = body.startDate;
    request.endDate = body.endDate;
    request.type = body.type;
    request.page = body.page;
    request.limit = body.limit;
    return this.getSubscriptionEventsHandler.execute(request);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
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
      includeTax: false,
      taxPercent: null,
      basePrice: 79.99,
      taxAmount: 0,
      totalPrice: 79.99,
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
  async getSubscription(@Param('id', ParseIntPipe) id: number): Promise<GetSubscriptionResponse> {
    const request = new GetSubscriptionRequest();
    request.subscriptionId = id;
    return this.getSubscriptionHandler.execute(request);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
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
  @ApiBearerAuth('JWT-auth')
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

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener estadísticas de suscripciones',
    description: 'Obtiene estadísticas agregadas de suscripciones para un período determinado',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Fecha de inicio del período (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'Fecha de fin del período (ISO 8601)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    enum: ['day', 'week', 'month', 'quarter', 'year'],
    description: 'Agrupar resultados por período',
    example: 'month',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    type: SubscriptionStatsResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getStats(@Query() query: GetSubscriptionStatsRequest): Promise<SubscriptionStatsResponse> {
    return this.getSubscriptionStatsHandler.execute(query);
  }

  @Post('events')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener eventos de suscripciones',
    description:
      'Obtiene una lista paginada de eventos de suscripciones con filtros opcionales. Las fechas deben estar en formato YYYY-MM-DD (ej: 2024-01-01)',
  })
  @ApiBody({
    type: GetSubscriptionEventsRequest,
    description: 'Filtros para obtener eventos de suscripciones',
  })
  @ApiResponse({
    status: 200,
    description: 'Eventos obtenidos exitosamente',
    type: GetSubscriptionEventsResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros inválidos',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getEvents(
    @Body() request: GetSubscriptionEventsRequest,
  ): Promise<GetSubscriptionEventsResponse> {
    return this.getSubscriptionEventsHandler.execute(request);
  }

  @Get('stats/compare')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Comparar estadísticas de suscripciones entre períodos',
    description:
      'Compara estadísticas de suscripciones entre el período actual y un período anterior',
  })
  @ApiQuery({
    name: 'currentStartDate',
    required: true,
    type: String,
    description: 'Fecha de inicio del período actual (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'currentEndDate',
    required: true,
    type: String,
    description: 'Fecha de fin del período actual (ISO 8601)',
    example: '2024-03-31T23:59:59.999Z',
  })
  @ApiQuery({
    name: 'previousStartDate',
    required: true,
    type: String,
    description: 'Fecha de inicio del período anterior (ISO 8601)',
    example: '2023-10-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'previousEndDate',
    required: true,
    type: String,
    description: 'Fecha de fin del período anterior (ISO 8601)',
    example: '2023-12-31T23:59:59.999Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Comparación obtenida exitosamente',
    type: GetSubscriptionStatsCompareResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async compareStats(
    @Query() query: GetSubscriptionStatsCompareRequest,
  ): Promise<GetSubscriptionStatsCompareResponse> {
    return this.getSubscriptionStatsCompareHandler.execute(query);
  }

  @Get('stats/timeseries')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener series temporales de estadísticas',
    description: 'Obtiene estadísticas de suscripciones agrupadas por período temporal',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Fecha de inicio del período (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'Fecha de fin del período (ISO 8601)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @ApiQuery({
    name: 'groupBy',
    required: true,
    enum: ['day', 'week', 'month', 'quarter'],
    description: 'Agrupar resultados por período',
    example: 'month',
  })
  @ApiResponse({
    status: 200,
    description: 'Series temporales obtenidas exitosamente',
    type: GetSubscriptionTimeseriesResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getTimeseries(
    @Query() query: GetSubscriptionTimeseriesRequest,
  ): Promise<GetSubscriptionTimeseriesResponse> {
    return this.getSubscriptionTimeseriesHandler.execute(query);
  }
}

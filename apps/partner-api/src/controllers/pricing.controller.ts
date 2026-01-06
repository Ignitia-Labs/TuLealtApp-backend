import {
  Controller,
  Get,
  Query,
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
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  GetPricingPlansHandler,
  GetPricingPlansRequest,
  GetPricingPlansResponse,
  GetPricingPlanByIdHandler,
  GetPricingPlanByIdRequest,
  GetPricingPlanByIdResponse,
  GetPricingPlanBySlugHandler,
  GetPricingPlanBySlugRequest,
  GetPricingPlanBySlugResponse,
  CalculatePriceHandler,
  CalculatePriceRequest,
  CalculatePriceResponse,
} from '@libs/application';
import {
  BadRequestErrorResponseDto,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  InternalServerErrorResponseDto,
  JwtAuthGuard,
  RolesGuard,
  Roles,
} from '@libs/shared';

/**
 * Controlador de planes de precios para Partner API
 * Permite consultar planes activos y calcular precios
 *
 * Endpoints:
 * - GET /partner/pricing/plans - Obtener planes activos
 * - GET /partner/pricing/plans/:id - Obtener plan activo por ID
 * - GET /partner/pricing/plans/slug/:slug - Obtener plan activo por slug
 * - GET /partner/pricing/calculate - Calcular precio de un plan
 */
@ApiTags('Partner Pricing')
@Controller('pricing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PARTNER', 'PARTNER_STAFF', 'ADMIN', 'ADMIN_STAFF')
@ApiBearerAuth('JWT-auth')
export class PricingController {
  constructor(
    private readonly getPricingPlansHandler: GetPricingPlansHandler,
    private readonly getPricingPlanByIdHandler: GetPricingPlanByIdHandler,
    private readonly getPricingPlanBySlugHandler: GetPricingPlanBySlugHandler,
    private readonly calculatePriceHandler: CalculatePriceHandler,
  ) {}

  @Get('plans')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener planes de precios activos',
    description:
      'Obtiene la lista de planes de precios activos disponibles para partners. Solo muestra planes con estado activo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de planes de precios activos obtenida exitosamente',
    type: GetPricingPlansResponse,
    example: {
      plans: [
        {
          id: 1,
          name: 'Esencia',
          slug: 'esencia',
          description: 'Plan básico para pequeños negocios',
          monthlyPrice: 29.99,
          quarterlyPrice: 79.99,
          semiannualPrice: 149.99,
          annualPrice: 279.99,
          currency: 'USD',
          features: ['Hasta 1 tenant', 'Hasta 5 branches', 'Soporte por email'],
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          name: 'Conecta',
          slug: 'conecta',
          description: 'Plan intermedio para negocios en crecimiento',
          monthlyPrice: 59.99,
          quarterlyPrice: 159.99,
          semiannualPrice: 299.99,
          annualPrice: 559.99,
          currency: 'USD',
          features: ['Hasta 3 tenants', 'Hasta 15 branches', 'Soporte prioritario'],
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
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
    description: 'No tiene permisos para acceder a este recurso',
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
  async getPlans(): Promise<GetPricingPlansResponse> {
    const request = new GetPricingPlansRequest();
    request.includeInactive = false; // Solo planes activos para partners
    return this.getPricingPlansHandler.execute(request);
  }

  @Get('plans/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener plan de precios activo por ID',
    description:
      'Obtiene un plan de precios activo específico por su ID. Solo retorna planes con estado activo.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del plan de precios',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Plan de precios obtenido exitosamente',
    type: GetPricingPlanByIdResponse,
    example: {
      id: 1,
      name: 'Esencia',
      slug: 'esencia',
      description: 'Plan básico para pequeños negocios',
      monthlyPrice: 29.99,
      quarterlyPrice: 79.99,
      semiannualPrice: 149.99,
      annualPrice: 279.99,
      currency: 'USD',
      features: ['Hasta 1 tenant', 'Hasta 5 branches', 'Soporte por email'],
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'ID inválido',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['id must be a number'],
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
    description: 'No tiene permisos para acceder a este recurso',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Plan de precios no encontrado o inactivo',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Pricing plan with ID 1 not found or inactive',
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
  async getPlanById(@Param('id', ParseIntPipe) id: number): Promise<GetPricingPlanByIdResponse> {
    const request = new GetPricingPlanByIdRequest();
    request.planId = id;
    return this.getPricingPlanByIdHandler.execute(request);
  }

  @Get('plans/slug/:slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener plan de precios activo por slug',
    description:
      'Obtiene un plan de precios activo específico por su slug. Solo retorna planes con estado activo.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Slug del plan de precios',
    type: String,
    example: 'esencia',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Plan de precios obtenido exitosamente',
    type: GetPricingPlanBySlugResponse,
    example: {
      id: 1,
      name: 'Esencia',
      slug: 'esencia',
      description: 'Plan básico para pequeños negocios',
      monthlyPrice: 29.99,
      quarterlyPrice: 79.99,
      semiannualPrice: 149.99,
      annualPrice: 279.99,
      currency: 'USD',
      features: ['Hasta 1 tenant', 'Hasta 5 branches', 'Soporte por email'],
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Slug inválido',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['slug should not be empty', 'slug must be a string'],
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
    description: 'No tiene permisos para acceder a este recurso',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Plan de precios no encontrado o inactivo',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Pricing plan with slug esencia not found or inactive',
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
  async getPlanBySlug(@Param('slug') slug: string): Promise<GetPricingPlanBySlugResponse> {
    const request = new GetPricingPlanBySlugRequest();
    request.slug = slug;
    return this.getPricingPlanBySlugHandler.execute(request);
  }

  @Get('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calcular precio de un plan',
    description:
      'Calcula el precio final de un plan activo para un período de facturación específico. Permite especificar la moneda para el cálculo (USD o GTQ).',
  })
  @ApiQuery({
    name: 'planId',
    required: true,
    type: Number,
    description: 'ID del plan de precios',
    example: 1,
  })
  @ApiQuery({
    name: 'period',
    required: true,
    enum: ['monthly', 'quarterly', 'semiannual', 'annual'],
    description: 'Período de facturación',
    example: 'monthly',
  })
  @ApiQuery({
    name: 'currency',
    required: false,
    enum: ['USD', 'GTQ'],
    description: 'Moneda para el cálculo (por defecto USD)',
    example: 'USD',
  })
  @ApiResponse({
    status: 200,
    description: 'Precio calculado exitosamente',
    type: CalculatePriceResponse,
    example: {
      planId: 1,
      planName: 'Esencia',
      period: 'monthly',
      currency: 'USD',
      price: 29.99,
      originalPrice: 29.99,
      discount: 0,
      finalPrice: 29.99,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: [
        'planId must be a number',
        'period must be one of the following values: monthly, quarterly, semiannual, annual',
        'currency must be one of the following values: USD, GTQ',
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
    description: 'No tiene permisos para acceder a este recurso',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Plan de precios no encontrado o inactivo',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Pricing plan with ID 1 not found or inactive',
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
  async calculatePrice(
    @Query('planId', ParseIntPipe) planId: number,
    @Query('period') period: string,
    @Query('currency') currency?: string,
  ): Promise<CalculatePriceResponse> {
    const request = new CalculatePriceRequest();
    request.planId = planId;
    request.period = period as any;
    request.currency = currency as 'USD' | 'GTQ' | undefined;
    return this.calculatePriceHandler.execute(request);
  }
}

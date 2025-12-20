import {
  Controller,
  Get,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
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
@Controller('partner/pricing')
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
    description: 'Obtiene la lista de planes de precios activos disponibles para partners.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de planes de precios activos obtenida exitosamente',
    type: GetPricingPlansResponse,
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
    description: 'Obtiene un plan de precios activo específico por su ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del plan de precios',
    example: 'plan-1',
  })
  @ApiResponse({
    status: 200,
    description: 'Plan de precios obtenido exitosamente',
    type: GetPricingPlanByIdResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Plan de precios no encontrado o inactivo',
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
    description: 'Obtiene un plan de precios activo específico por su slug.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Slug del plan de precios',
    example: 'esencia',
  })
  @ApiResponse({
    status: 200,
    description: 'Plan de precios obtenido exitosamente',
    type: GetPricingPlanBySlugResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Plan de precios no encontrado o inactivo',
  })
  async getPlanBySlug(
    @Param('slug') slug: string,
  ): Promise<GetPricingPlanBySlugResponse> {
    const request = new GetPricingPlanBySlugRequest();
    request.slug = slug;
    return this.getPricingPlanBySlugHandler.execute(request);
  }

  @Get('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calcular precio de un plan',
    description: 'Calcula el precio final de un plan activo para un período de facturación específico.',
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
    description: 'Moneda para el cálculo',
    example: 'USD',
  })
  @ApiResponse({
    status: 200,
    description: 'Precio calculado exitosamente',
    type: CalculatePriceResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Plan de precios no encontrado o inactivo',
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


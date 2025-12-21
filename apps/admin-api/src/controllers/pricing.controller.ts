import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
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
  CreatePricingPlanHandler,
  CreatePricingPlanRequest,
  CreatePricingPlanResponse,
  UpdatePricingPlanHandler,
  UpdatePricingPlanRequest,
  UpdatePricingPlanResponse,
  ToggleStatusPricingPlanHandler,
  ToggleStatusPricingPlanRequest,
  ToggleStatusPricingPlanResponse,
  DeletePricingPlanHandler,
  DeletePricingPlanRequest,
  DeletePricingPlanResponse,
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
 * Controlador de planes de precios para Admin API
 * Permite gestión completa de planes de precios
 *
 * Endpoints:
 * - GET /admin/pricing/plans - Obtener todos los planes (incluye inactivos)
 * - GET /admin/pricing/plans/:id - Obtener plan por ID
 * - GET /admin/pricing/plans/slug/:slug - Obtener plan por slug
 * - GET /admin/pricing/calculate - Calcular precio de un plan
 * - POST /admin/pricing/plans - Crear un nuevo plan de precios
 * - PATCH /admin/pricing/plans/:id - Actualizar un plan de precios existente
 * - PATCH /admin/pricing/plans/:id/toggle-status - Activar/desactivar un plan de precios
 * - DELETE /admin/pricing/plans/:id - Eliminar un plan de precios
 */
@ApiTags('Admin Pricing')
@Controller('pricing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class PricingController {
  constructor(
    private readonly getPricingPlansHandler: GetPricingPlansHandler,
    private readonly getPricingPlanByIdHandler: GetPricingPlanByIdHandler,
    private readonly getPricingPlanBySlugHandler: GetPricingPlanBySlugHandler,
    private readonly calculatePriceHandler: CalculatePriceHandler,
    private readonly createPricingPlanHandler: CreatePricingPlanHandler,
    private readonly updatePricingPlanHandler: UpdatePricingPlanHandler,
    private readonly toggleStatusPricingPlanHandler: ToggleStatusPricingPlanHandler,
    private readonly deletePricingPlanHandler: DeletePricingPlanHandler,
  ) {}

  @Get('plans')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todos los planes de precios',
    description:
      'Obtiene la lista completa de planes de precios. Los administradores pueden ver planes inactivos.',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Incluir planes inactivos',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de planes de precios obtenida exitosamente',
    type: GetPricingPlansResponse,
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
  async getPlans(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<GetPricingPlansResponse> {
    const request = new GetPricingPlansRequest();
    request.includeInactive = includeInactive === 'true';
    return this.getPricingPlansHandler.execute(request);
  }

  @Get('plans/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener plan de precios por ID',
    description: 'Obtiene un plan de precios específico por su ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del plan de precios',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Plan de precios obtenido exitosamente',
    type: GetPricingPlanByIdResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Plan de precios no encontrado',
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
  async getPlanById(@Param('id', ParseIntPipe) id: number): Promise<GetPricingPlanByIdResponse> {
    const request = new GetPricingPlanByIdRequest();
    request.planId = id;
    return this.getPricingPlanByIdHandler.execute(request);
  }

  @Get('plans/slug/:slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener plan de precios por slug',
    description: 'Obtiene un plan de precios específico por su slug.',
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
    description: 'Plan de precios no encontrado',
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
  async getPlanBySlug(@Param('slug') slug: string): Promise<GetPricingPlanBySlugResponse> {
    const request = new GetPricingPlanBySlugRequest();
    request.slug = slug;
    return this.getPricingPlanBySlugHandler.execute(request);
  }

  @Get('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calcular precio de un plan',
    description: 'Calcula el precio final de un plan para un período de facturación específico.',
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
    description: 'Plan de precios no encontrado',
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

  @Post('plans')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo plan de precios',
    description:
      'Crea un nuevo plan de precios con todas sus relaciones (pricing, promotions, features).',
  })
  @ApiBody({
    type: CreatePricingPlanRequest,
    description: 'Datos del plan de precios a crear',
  })
  @ApiResponse({
    status: 201,
    description: 'Plan de precios creado exitosamente',
    type: CreatePricingPlanResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o slug ya existe',
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
  async createPlan(@Body() request: CreatePricingPlanRequest): Promise<CreatePricingPlanResponse> {
    return this.createPricingPlanHandler.execute(request);
  }

  @Patch('plans/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar un plan de precios',
    description:
      'Actualiza un plan de precios existente. Solo se actualizan los campos proporcionados. Las relaciones (pricing, promotions, features) se actualizan completamente si se proporcionan.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del plan de precios',
    example: 1,
  })
  @ApiBody({
    type: UpdatePricingPlanRequest,
    description: 'Datos del plan de precios a actualizar (todos los campos son opcionales)',
  })
  @ApiResponse({
    status: 200,
    description: 'Plan de precios actualizado exitosamente',
    type: UpdatePricingPlanResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o slug ya existe',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Plan de precios no encontrado',
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
  async updatePlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdatePricingPlanRequest,
  ): Promise<UpdatePricingPlanResponse> {
    request.planId = id;
    return this.updatePricingPlanHandler.execute(request);
  }

  @Patch('plans/:id/toggle-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activar/desactivar un plan de precios',
    description:
      'Cambia el estado de un plan de precios. Si está activo, lo desactiva; si está inactivo, lo activa.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del plan de precios',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del plan actualizado exitosamente',
    type: ToggleStatusPricingPlanResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Plan de precios no encontrado',
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
  async toggleStatusPlan(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ToggleStatusPricingPlanResponse> {
    const request = new ToggleStatusPricingPlanRequest();
    request.planId = id;
    return this.toggleStatusPricingPlanHandler.execute(request);
  }

  @Delete('plans/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar un plan de precios',
    description: 'Elimina permanentemente un plan de precios de la base de datos.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del plan de precios a eliminar',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Plan de precios eliminado exitosamente',
    type: DeletePricingPlanResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Plan de precios no encontrado',
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
  async deletePlan(@Param('id', ParseIntPipe) id: number): Promise<DeletePricingPlanResponse> {
    const request = new DeletePricingPlanRequest();
    request.planId = id;
    return this.deletePricingPlanHandler.execute(request);
  }
}

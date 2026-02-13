import {
  Controller,
  Get,
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
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  GetLoyaltyDashboardHandler,
  GetLoyaltyDashboardRequest,
  GetLoyaltyDashboardResponse,
  GetNewCustomersHandler,
  GetNewCustomersRequest,
  GetNewCustomersResponse,
  GetCustomerSegmentationHandler,
  GetCustomerSegmentationRequest,
  GetCustomerSegmentationResponse,
  GetCustomerGrowthHandler,
  GetCustomerGrowthRequest,
  GetCustomerGrowthResponse,
} from '@libs/application';
import {
  JwtAuthGuard,
  RolesGuard,
  PartnerResourceGuard,
  Roles,
  CurrentUser,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
} from '@libs/shared';
import { JwtPayload } from '@libs/application';

/**
 * Controlador de dashboard de lealtad para Partner API
 * Permite obtener métricas generales del programa de lealtad de un tenant
 */
@ApiTags('Loyalty Dashboard')
@Controller('tenants/:tenantId/loyalty/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard, PartnerResourceGuard)
@Roles('PARTNER', 'PARTNER_STAFF', 'ADMIN', 'ADMIN_STAFF')
@ApiBearerAuth('JWT-auth')
export class LoyaltyDashboardController {
  constructor(
    private readonly getLoyaltyDashboardHandler: GetLoyaltyDashboardHandler,
    private readonly getNewCustomersHandler: GetNewCustomersHandler,
    private readonly getCustomerSegmentationHandler: GetCustomerSegmentationHandler,
    private readonly getCustomerGrowthHandler: GetCustomerGrowthHandler,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener dashboard de lealtad',
    description:
      'Obtiene métricas generales del programa de lealtad del tenant: total de customers, puntos emitidos/canjeados, top reward rules y actividad reciente. El tenant debe pertenecer al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['all', 'month', 'week', 'custom'],
    description: 'Período de tiempo para las métricas',
    example: 'month',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Fecha de inicio (ISO 8601). Requerido si period="custom"',
    example: '2026-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Fecha de fin (ISO 8601). Requerido si period="custom"',
    example: '2026-01-31T23:59:59Z',
  })
  @ApiQuery({
    name: 'includeCustomer',
    required: false,
    type: Boolean,
    description: 'Si es true, incluye información del cliente en cada transacción',
    example: false,
  })
  @ApiQuery({
    name: 'includeBranch',
    required: false,
    type: Boolean,
    description: 'Si es true, incluye información de la sucursal en cada transacción',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard de lealtad obtenido exitosamente',
    type: GetLoyaltyDashboardResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o el tenant no pertenece a su partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async getLoyaltyDashboard(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @CurrentUser() _user: JwtPayload, // eslint-disable-line @typescript-eslint/no-unused-vars
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('includeCustomer') includeCustomer?: string,
    @Query('includeBranch') includeBranch?: string,
  ): Promise<GetLoyaltyDashboardResponse> {
    const request = new GetLoyaltyDashboardRequest();
    request.tenantId = tenantId;
    if (period) {
      request.period = period as any;
    }
    if (startDate) {
      request.startDate = startDate;
    }
    if (endDate) {
      request.endDate = endDate;
    }
    if (includeCustomer) {
      request.includeCustomer = includeCustomer === 'true';
    }
    if (includeBranch) {
      request.includeBranch = includeBranch === 'true';
    }

    return this.getLoyaltyDashboardHandler.execute(request);
  }

  @Get('customers/new-customers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener nuevos clientes agrupados por período',
    description:
      'Obtiene nuevos clientes agrupados por día, semana o mes para análisis temporal. ' +
      'Útil para visualizar crecimiento de clientes en el dashboard.',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    enum: ['day', 'week', 'month'],
    description: 'Agrupación temporal',
    example: 'week',
  })
  @ApiQuery({
    name: 'weeks',
    required: false,
    type: Number,
    description: 'Número de semanas a devolver (solo si groupBy="week")',
    example: 4,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Fecha de inicio (ISO 8601)',
    example: '2026-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Fecha de fin (ISO 8601)',
    example: '2026-01-31T23:59:59Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Nuevos clientes agrupados obtenidos exitosamente',
    type: GetNewCustomersResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o el tenant no pertenece a su partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async getNewCustomers(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @CurrentUser() _user: JwtPayload, // eslint-disable-line @typescript-eslint/no-unused-vars
    @Query('groupBy') groupBy?: string,
    @Query('weeks') weeks?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<GetNewCustomersResponse> {
    const request = new GetNewCustomersRequest();
    request.tenantId = tenantId;
    if (groupBy) {
      request.groupBy = groupBy as any;
    }
    if (weeks) {
      request.weeks = parseInt(weeks, 10);
    }
    if (startDate) {
      request.startDate = startDate;
    }
    if (endDate) {
      request.endDate = endDate;
    }
    return this.getNewCustomersHandler.execute(request);
  }

  @Get('segmentation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener segmentación de clientes',
    description:
      'Obtiene segmentación automática de clientes según su comportamiento: VIP, FREQUENT, OCCASIONAL, AT_RISK. ' +
      'Incluye métricas detalladas por segmento e insights automáticos.',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['all', 'month', 'week', 'custom'],
    description: 'Período de tiempo para analizar la actividad de clientes',
    example: 'month',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Fecha de inicio (ISO 8601). Requerido si period="custom"',
    example: '2026-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Fecha de fin (ISO 8601). Requerido si period="custom"',
    example: '2026-01-31T23:59:59Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Segmentación de clientes obtenida exitosamente',
    type: GetCustomerSegmentationResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o el tenant no pertenece a su partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async getCustomerSegmentation(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @CurrentUser() _user: JwtPayload, // eslint-disable-line @typescript-eslint/no-unused-vars
    @Query() query: Partial<GetCustomerSegmentationRequest>,
  ): Promise<GetCustomerSegmentationResponse> {
    const request = new GetCustomerSegmentationRequest();
    request.tenantId = tenantId;
    request.period = query.period;
    request.startDate = query.startDate;
    request.endDate = query.endDate;

    return this.getCustomerSegmentationHandler.execute(request);
  }

  @Get('growth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener evolución histórica de clientes',
    description:
      'Obtiene el crecimiento temporal de clientes con agrupación por día, semana o mes. ' +
      'Incluye nuevos clientes, acumulados y tasas de crecimiento por período.',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    enum: ['day', 'week', 'month'],
    description: 'Agrupación temporal',
    example: 'week',
  })
  @ApiQuery({
    name: 'periods',
    required: false,
    type: Number,
    description: 'Número de períodos a mostrar (ej: 4 weeks, 6 months)',
    example: 12,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Fecha de inicio custom (ISO 8601)',
    example: '2025-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Fecha de fin custom (ISO 8601)',
    example: '2026-01-31T23:59:59Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Evolución de clientes obtenida exitosamente',
    type: GetCustomerGrowthResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o el tenant no pertenece a su partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async getCustomerGrowth(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @CurrentUser() _user: JwtPayload, // eslint-disable-line @typescript-eslint/no-unused-vars
    @Query() query: Partial<GetCustomerGrowthRequest>,
  ): Promise<GetCustomerGrowthResponse> {
    const request = new GetCustomerGrowthRequest();
    request.tenantId = tenantId;
    request.groupBy = query.groupBy as any;
    request.periods = query.periods ? Number(query.periods) : undefined;
    request.startDate = query.startDate;
    request.endDate = query.endDate;

    return this.getCustomerGrowthHandler.execute(request);
  }
}

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
  GetPaymentCommissionsHandler,
  GetPaymentCommissionsRequest,
  GetPaymentCommissionsResponse,
  GetBillingCycleCommissionsHandler,
  GetBillingCycleCommissionsRequest,
  GetBillingCycleCommissionsResponse,
  GetCommissionsHandler,
  GetCommissionsRequest,
  GetCommissionsResponse,
  GetCommissionSummaryHandler,
  GetCommissionSummaryRequest,
  GetCommissionSummaryResponse,
  MarkCommissionsPaidHandler,
  MarkCommissionsPaidRequest,
  MarkCommissionsPaidResponse,
  GetPendingDisbursementsHandler,
  GetPendingDisbursementsRequest,
  GetPendingDisbursementsResponse,
  GetCommissionsDashboardHandler,
  GetCommissionsDashboardRequest,
  GetCommissionsDashboardResponse,
} from '@libs/application';
import {
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  BadRequestErrorResponseDto,
  NotFoundErrorResponseDto,
  InternalServerErrorResponseDto,
  JwtAuthGuard,
  RolesGuard,
  Roles,
} from '@libs/shared';

/**
 * Controlador para gestionar comisiones
 */
@ApiTags('Commissions')
@ApiBearerAuth()
@Controller('admin/commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CommissionsController {
  constructor(
    private readonly getPaymentCommissionsHandler: GetPaymentCommissionsHandler,
    private readonly getBillingCycleCommissionsHandler: GetBillingCycleCommissionsHandler,
    private readonly getCommissionsHandler: GetCommissionsHandler,
    private readonly getCommissionSummaryHandler: GetCommissionSummaryHandler,
    private readonly markCommissionsPaidHandler: MarkCommissionsPaidHandler,
    private readonly getPendingDisbursementsHandler: GetPendingDisbursementsHandler,
    private readonly getCommissionsDashboardHandler: GetCommissionsDashboardHandler,
  ) {}

  @Get('payments/:paymentId')
  @ApiOperation({
    summary: 'Obtener comisiones de un pago',
    description: 'Obtiene todas las comisiones generadas para un pago específico',
  })
  @ApiParam({
    name: 'paymentId',
    type: Number,
    description: 'ID del pago',
  })
  @ApiResponse({
    status: 200,
    description: 'Comisiones del pago',
    type: GetPaymentCommissionsResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Pago no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async getPaymentCommissions(
    @Param('paymentId', ParseIntPipe) paymentId: number,
  ): Promise<GetPaymentCommissionsResponse> {
    const request = new GetPaymentCommissionsRequest();
    request.paymentId = paymentId;
    return this.getPaymentCommissionsHandler.execute(request);
  }

  @Get('billing-cycles/:billingCycleId')
  @ApiOperation({
    summary: 'Obtener comisiones de un billing cycle',
    description: 'Obtiene todas las comisiones generadas para un billing cycle específico',
  })
  @ApiParam({
    name: 'billingCycleId',
    type: Number,
    description: 'ID del billing cycle',
  })
  @ApiResponse({
    status: 200,
    description: 'Comisiones del billing cycle',
    type: GetBillingCycleCommissionsResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Billing cycle no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async getBillingCycleCommissions(
    @Param('billingCycleId', ParseIntPipe) billingCycleId: number,
  ): Promise<GetBillingCycleCommissionsResponse> {
    const request = new GetBillingCycleCommissionsRequest();
    request.billingCycleId = billingCycleId;
    return this.getBillingCycleCommissionsHandler.execute(request);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener comisiones con filtros',
    description: 'Obtiene comisiones con filtros opcionales por staff, partner, estado y fechas',
  })
  @ApiQuery({
    name: 'staffUserId',
    required: false,
    type: Number,
    description: 'Filtrar por ID de usuario staff',
  })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    type: Number,
    description: 'Filtrar por ID de partner',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'paid', 'cancelled'],
    description: 'Filtrar por estado',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Fecha de inicio (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Fecha de fin (ISO 8601)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Límite de resultados por página',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de comisiones',
    type: GetCommissionsResponse,
  })
  async getCommissions(
    @Query() query: any,
  ): Promise<GetCommissionsResponse> {
    const request = new GetCommissionsRequest();
    if (query.staffUserId) {
      request.staffUserId = Number(query.staffUserId);
    }
    if (query.partnerId) {
      request.partnerId = Number(query.partnerId);
    }
    if (query.status) {
      request.status = query.status;
    }
    if (query.startDate) {
      request.startDate = query.startDate;
    }
    if (query.endDate) {
      request.endDate = query.endDate;
    }
    if (query.page) {
      request.page = Number(query.page);
    }
    if (query.limit) {
      request.limit = Number(query.limit);
    }
    return this.getCommissionsHandler.execute(request);
  }

  @Get('staff/:staffUserId/summary')
  @ApiOperation({
    summary: 'Obtener resumen de comisiones por staff',
    description: 'Obtiene un resumen completo de comisiones de un usuario staff',
  })
  @ApiParam({
    name: 'staffUserId',
    type: Number,
    description: 'ID del usuario staff',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Fecha de inicio (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Fecha de fin (ISO 8601)',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen de comisiones',
    type: GetCommissionSummaryResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario staff no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async getCommissionSummary(
    @Param('staffUserId', ParseIntPipe) staffUserId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<GetCommissionSummaryResponse> {
    const request = new GetCommissionSummaryRequest();
    request.staffUserId = staffUserId;
    if (startDate) {
      request.startDate = startDate;
    }
    if (endDate) {
      request.endDate = endDate;
    }
    return this.getCommissionSummaryHandler.execute(request);
  }

  @Get('pending-disbursements')
  @ApiOperation({
    summary: 'Obtener desembolsos pendientes',
    description: 'Obtiene la lista de desembolsos pendientes agrupados por usuario staff',
  })
  @ApiQuery({
    name: 'staffUserId',
    required: false,
    type: Number,
    description: 'Filtrar por ID de usuario staff',
  })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    type: Number,
    description: 'Filtrar por ID de partner',
  })
  @ApiQuery({
    name: 'minAmount',
    required: false,
    type: Number,
    description: 'Monto mínimo de comisiones pendientes',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Límite de resultados por página',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de desembolsos pendientes',
    type: GetPendingDisbursementsResponse,
  })
  async getPendingDisbursements(
    @Query() query: any,
  ): Promise<GetPendingDisbursementsResponse> {
    const request = new GetPendingDisbursementsRequest();
    if (query.staffUserId) {
      request.staffUserId = Number(query.staffUserId);
    }
    if (query.partnerId) {
      request.partnerId = Number(query.partnerId);
    }
    if (query.minAmount) {
      request.minAmount = Number(query.minAmount);
    }
    if (query.page) {
      request.page = Number(query.page);
    }
    if (query.limit) {
      request.limit = Number(query.limit);
    }
    return this.getPendingDisbursementsHandler.execute(request);
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Obtener dashboard de comisiones',
    description:
      'Obtiene estadísticas agregadas de comisiones para visualización en dashboard: resumen general, estadísticas por período, top staff y top partners',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Fecha de inicio (ISO 8601). Por defecto: inicio del año actual',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Fecha de fin (ISO 8601). Por defecto: hoy',
  })
  @ApiQuery({
    name: 'periodGroup',
    required: false,
    enum: ['daily', 'weekly', 'monthly'],
    description: 'Agrupación de período para estadísticas. Por defecto: monthly',
  })
  @ApiQuery({
    name: 'topStaffLimit',
    required: false,
    type: Number,
    description: 'Número de top staff a retornar. Por defecto: 10',
  })
  @ApiQuery({
    name: 'topPartnersLimit',
    required: false,
    type: Number,
    description: 'Número de top partners a retornar. Por defecto: 10',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard de comisiones',
    type: GetCommissionsDashboardResponse,
  })
  async getDashboard(
    @Query() query: any,
  ): Promise<GetCommissionsDashboardResponse> {
    const request = new GetCommissionsDashboardRequest();
    if (query.startDate) {
      request.startDate = query.startDate;
    }
    if (query.endDate) {
      request.endDate = query.endDate;
    }
    if (query.periodGroup) {
      request.periodGroup = query.periodGroup;
    }
    if (query.topStaffLimit) {
      request.topStaffLimit = Number(query.topStaffLimit);
    }
    if (query.topPartnersLimit) {
      request.topPartnersLimit = Number(query.topPartnersLimit);
    }
    return this.getCommissionsDashboardHandler.execute(request);
  }

  @Post('mark-as-paid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar comisiones como pagadas',
    description: 'Marca una o más comisiones como pagadas',
  })
  @ApiBody({ type: MarkCommissionsPaidRequest })
  @ApiResponse({
    status: 200,
    description: 'Comisiones marcadas como pagadas',
    type: MarkCommissionsPaidResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
    type: BadRequestErrorResponseDto,
  })
  async markAsPaid(
    @Body() request: MarkCommissionsPaidRequest,
  ): Promise<MarkCommissionsPaidResponse> {
    return this.markCommissionsPaidHandler.execute(request);
  }
}


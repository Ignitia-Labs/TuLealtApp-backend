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
    private readonly getCommissionsHandler: GetCommissionsHandler,
    private readonly getCommissionSummaryHandler: GetCommissionSummaryHandler,
    private readonly markCommissionsPaidHandler: MarkCommissionsPaidHandler,
    private readonly getPendingDisbursementsHandler: GetPendingDisbursementsHandler,
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


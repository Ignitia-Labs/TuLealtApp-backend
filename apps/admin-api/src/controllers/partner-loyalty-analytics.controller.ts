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
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  GetLoyaltyDashboardHandler,
  GetLoyaltyDashboardRequest,
  GetLoyaltyDashboardResponse,
  GetCustomerPointsTransactionsHandler,
  GetCustomerPointsTransactionsRequest,
  GetPointsTransactionsResponse,
  CreatePointsAdjustmentHandler,
  CreatePointsAdjustmentRequest,
  CreatePointsAdjustmentResponse,
  CreatePointsReversalHandler,
  CreatePointsReversalRequest,
  CreatePointsReversalResponse,
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
 * Controlador para analytics y gestión de transacciones de puntos desde Admin API
 * Permite a los administradores ver analytics y gestionar transacciones de puntos
 */
@ApiTags('Partner Loyalty Analytics')
@Controller('partners/:partnerId')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ADMIN_STAFF', 'WEBMASTER')
@ApiBearerAuth('JWT-auth')
export class PartnerLoyaltyAnalyticsController {
  constructor(
    private readonly getLoyaltyDashboardHandler: GetLoyaltyDashboardHandler,
    private readonly getCustomerPointsTransactionsHandler: GetCustomerPointsTransactionsHandler,
    private readonly createPointsAdjustmentHandler: CreatePointsAdjustmentHandler,
    private readonly createPointsReversalHandler: CreatePointsReversalHandler,
  ) {}

  @Get('tenants/:tenantId/loyalty/dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dashboard de lealtad de un tenant',
    description: 'Obtiene métricas generales del programa de lealtad del tenant',
  })
  @ApiParam({ name: 'partnerId', type: Number })
  @ApiParam({ name: 'tenantId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Dashboard obtenido exitosamente',
    type: GetLoyaltyDashboardResponse,
  })
  async getLoyaltyDashboard(
    @Param('partnerId', ParseIntPipe) partnerId: number,
    @Param('tenantId', ParseIntPipe) tenantId: number,
  ): Promise<GetLoyaltyDashboardResponse> {
    const request = new GetLoyaltyDashboardRequest();
    request.tenantId = tenantId;
    return this.getLoyaltyDashboardHandler.execute(request);
  }

  @Get('customers/:membershipId/points-transactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Historial de transacciones de puntos de un customer',
    description: 'Obtiene el historial completo de transacciones de puntos de un customer',
  })
  @ApiParam({ name: 'partnerId', type: Number })
  @ApiParam({ name: 'membershipId', type: Number })
  @ApiQuery({
    name: 'type',
    enum: ['EARNING', 'REDEEM', 'ADJUSTMENT', 'REVERSAL', 'EXPIRATION', 'all'],
    required: false,
  })
  @ApiQuery({ name: 'fromDate', type: String, required: false })
  @ApiQuery({ name: 'toDate', type: String, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({
    status: 200,
    description: 'Historial de transacciones obtenido exitosamente',
    type: GetPointsTransactionsResponse,
  })
  async getCustomerPointsTransactions(
    @Param('partnerId', ParseIntPipe) partnerId: number,
    @Param('membershipId', ParseIntPipe) membershipId: number,
    @Query('type') type?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<GetPointsTransactionsResponse> {
    const request = new GetCustomerPointsTransactionsRequest();
    request.membershipId = membershipId;
    request.type = (type as any) || 'all';
    request.fromDate = fromDate;
    request.toDate = toDate;
    request.page = page || 1;
    request.limit = limit || 20;
    // Admin puede acceder a cualquier partner, pasar el partnerId del parámetro
    return this.getCustomerPointsTransactionsHandler.execute(request, partnerId);
  }

  @Post('customers/:membershipId/points/adjustment')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear ajuste manual de puntos',
    description: 'Crea un ajuste manual de puntos para un customer (solo ADMIN)',
  })
  @ApiParam({ name: 'partnerId', type: Number })
  @ApiParam({ name: 'membershipId', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Ajuste creado exitosamente',
    type: CreatePointsAdjustmentResponse,
  })
  async createPointsAdjustment(
    @Param('partnerId', ParseIntPipe) partnerId: number,
    @Param('membershipId', ParseIntPipe) membershipId: number,
    @Body() body: CreatePointsAdjustmentRequest,
  ): Promise<CreatePointsAdjustmentResponse> {
    const request = new CreatePointsAdjustmentRequest();
    request.membershipId = membershipId;
    Object.assign(request, body);
    // Admin puede crear ajustes para cualquier partner, usar 'admin' como createdBy
    return this.createPointsAdjustmentHandler.execute(request, partnerId, 'admin');
  }

  @Post('customers/:membershipId/points/reversal')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear reversión de transacción',
    description: 'Crea una reversión de una transacción de puntos existente (solo ADMIN)',
  })
  @ApiParam({ name: 'partnerId', type: Number })
  @ApiParam({ name: 'membershipId', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Reversión creada exitosamente',
    type: CreatePointsReversalResponse,
  })
  async createPointsReversal(
    @Param('partnerId', ParseIntPipe) partnerId: number,
    @Param('membershipId', ParseIntPipe) membershipId: number,
    @Body() body: CreatePointsReversalRequest,
  ): Promise<CreatePointsReversalResponse> {
    const request = new CreatePointsReversalRequest();
    request.membershipId = membershipId;
    Object.assign(request, body);
    // Admin puede crear reversiones para cualquier partner, usar 'admin' como createdBy
    return this.createPointsReversalHandler.execute(request, partnerId, 'admin');
  }
}

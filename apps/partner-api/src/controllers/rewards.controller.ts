import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
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
  UpdateRewardHandler,
  UpdateRewardRequest,
  UpdateRewardResponse,
  DeleteRewardHandler,
  DeleteRewardRequest,
  ValidateRedemptionCodeHandler,
  ValidateRedemptionCodeRequest,
  ValidateRedemptionCodeResponse,
  GetTopRedeemedRewardsHandler,
  GetTopRedeemedRewardsRequest,
  GetTopRedeemedRewardsResponse,
  GetTopRedeemedRewardsBodyDto,
  GetAdvancedRewardAnalyticsHandler,
  GetAdvancedRewardAnalyticsRequest,
  GetAdvancedRewardAnalyticsResponse,
  JwtPayload,
} from '@libs/application';
import { IUserRepository, ITenantRepository } from '@libs/domain';
import {
  JwtAuthGuard,
  RolesGuard,
  PartnerResourceGuard,
  Roles,
  CurrentUser,
  BadRequestErrorResponseDto,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
} from '@libs/shared';

/**
 * Controlador de recompensas canjeables para Partner API
 * Permite gestionar el catálogo de recompensas que los clientes pueden canjear con puntos
 */
@ApiTags('Rewards')
@Controller('tenants/:tenantId/rewards')
@UseGuards(JwtAuthGuard, RolesGuard, PartnerResourceGuard)
@Roles('PARTNER', 'PARTNER_STAFF', 'ADMIN', 'ADMIN_STAFF')
@ApiBearerAuth('JWT-auth')
export class RewardsController {
  constructor(
    private readonly createRewardHandler: CreateRewardHandler,
    private readonly getRewardsHandler: GetRewardsHandler,
    private readonly getRewardHandler: GetRewardHandler,
    private readonly updateRewardHandler: UpdateRewardHandler,
    private readonly deleteRewardHandler: DeleteRewardHandler,
    private readonly validateRedemptionCodeHandler: ValidateRedemptionCodeHandler,
    private readonly getTopRedeemedRewardsHandler: GetTopRedeemedRewardsHandler,
    private readonly getAdvancedRewardAnalyticsHandler: GetAdvancedRewardAnalyticsHandler,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear recompensa' })
  @ApiParam({ name: 'tenantId', type: Number, description: 'ID del tenant' })
  @ApiResponse({
    status: 201,
    description: 'Recompensa creada exitosamente',
    type: CreateRewardResponse,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: BadRequestErrorResponseDto })
  @ApiResponse({ status: 401, description: 'No autorizado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Prohibido', type: ForbiddenErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado', type: NotFoundErrorResponseDto })
  async createReward(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body() body: CreateRewardRequest,
  ): Promise<CreateRewardResponse> {
    body.tenantId = tenantId;
    return this.createRewardHandler.execute(body);
  }

  @Get()
  @ApiOperation({ summary: 'Listar recompensas' })
  @ApiParam({ name: 'tenantId', type: Number, description: 'ID del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Lista de recompensas',
    type: GetRewardsResponse,
  })
  @ApiResponse({ status: 401, description: 'No autorizado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Prohibido', type: ForbiddenErrorResponseDto })
  async getRewards(@Param('tenantId', ParseIntPipe) tenantId: number): Promise<GetRewardsResponse> {
    const request = new GetRewardsRequest();
    request.tenantId = tenantId;
    return this.getRewardsHandler.execute(request);
  }

  @Get('analytics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener analytics avanzados de recompensas',
    description:
      'Obtiene métricas avanzadas de recompensas incluyendo ROI, eficiencia, segmento top, ' +
      'sucursal top y tendencias. Útil para optimizar el catálogo de recompensas.',
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
    description: 'Período de tiempo para análisis',
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
    description: 'Analytics avanzados obtenidos exitosamente',
    type: GetAdvancedRewardAnalyticsResponse,
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
  async getAdvancedRewardAnalytics(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @CurrentUser() _user: JwtPayload, // eslint-disable-line @typescript-eslint/no-unused-vars
    @Query() query: Partial<GetAdvancedRewardAnalyticsRequest>,
  ): Promise<GetAdvancedRewardAnalyticsResponse> {
    const request = new GetAdvancedRewardAnalyticsRequest();
    request.tenantId = tenantId;
    request.period = query.period;
    request.startDate = query.startDate;
    request.endDate = query.endDate;

    return this.getAdvancedRewardAnalyticsHandler.execute(request);
  }

  @Get(':rewardId')
  @ApiOperation({ summary: 'Obtener recompensa por ID' })
  @ApiParam({ name: 'tenantId', type: Number, description: 'ID del tenant' })
  @ApiParam({ name: 'rewardId', type: Number, description: 'ID de la recompensa' })
  @ApiResponse({
    status: 200,
    description: 'Detalles de la recompensa',
    type: GetRewardResponse,
  })
  @ApiResponse({ status: 401, description: 'No autorizado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Prohibido', type: ForbiddenErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Recompensa no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async getReward(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('rewardId', ParseIntPipe) rewardId: number,
  ): Promise<GetRewardResponse> {
    const request = new GetRewardRequest();
    request.tenantId = tenantId;
    request.rewardId = rewardId;
    return this.getRewardHandler.execute(request);
  }

  @Patch(':rewardId')
  @ApiOperation({ summary: 'Actualizar recompensa' })
  @ApiParam({ name: 'tenantId', type: Number, description: 'ID del tenant' })
  @ApiParam({ name: 'rewardId', type: Number, description: 'ID de la recompensa' })
  @ApiResponse({
    status: 200,
    description: 'Recompensa actualizada exitosamente',
    type: UpdateRewardResponse,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: BadRequestErrorResponseDto })
  @ApiResponse({ status: 401, description: 'No autorizado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Prohibido', type: ForbiddenErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Recompensa no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async updateReward(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('rewardId', ParseIntPipe) rewardId: number,
    @Body() body: Partial<UpdateRewardRequest>,
  ): Promise<UpdateRewardResponse> {
    const request = new UpdateRewardRequest();
    request.tenantId = tenantId;
    request.rewardId = rewardId;
    Object.assign(request, body);
    return this.updateRewardHandler.execute(request);
  }

  @Delete(':rewardId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar recompensa' })
  @ApiParam({ name: 'tenantId', type: Number, description: 'ID del tenant' })
  @ApiParam({ name: 'rewardId', type: Number, description: 'ID de la recompensa' })
  @ApiResponse({ status: 204, description: 'Recompensa eliminada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Prohibido', type: ForbiddenErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Recompensa no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async deleteReward(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('rewardId', ParseIntPipe) rewardId: number,
  ): Promise<void> {
    const request = new DeleteRewardRequest();
    request.tenantId = tenantId;
    request.rewardId = rewardId;
    return this.deleteRewardHandler.execute(request);
  }

  @Post('validate-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar código de canje',
    description:
      'Valida un código de canje generado por un cliente y lo marca como usado. ' +
      'El código debe pertenecer al tenant del partner autenticado. ' +
      'Opcionalmente se puede incluir branchId para registrar la sucursal donde se validó el código.',
  })
  @ApiParam({ name: 'tenantId', type: Number, description: 'ID del tenant' })
  @ApiBody({
    type: ValidateRedemptionCodeRequest,
    description: 'Datos del código de canje (opcional: incluir branchId)',
    examples: {
      validacionBasica: {
        summary: 'Validación básica',
        description: 'Validar código sin especificar sucursal',
        value: {
          code: 'REWARD-ABC123-XYZ789',
        },
      },
      validacionConSucursal: {
        summary: 'Validación con sucursal',
        description: 'Validar código registrando la sucursal donde se validó',
        value: {
          code: 'REWARD-ABC123-XYZ789',
          branchId: 2,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Código validado exitosamente',
    type: ValidateRedemptionCodeResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Código inválido, expirado o ya usado',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o el código no pertenece a tu partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Código de canje no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async validateRedemptionCode(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body() body: ValidateRedemptionCodeRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<ValidateRedemptionCodeResponse> {
    // Obtener el partnerId del usuario autenticado
    const currentUser = await this.userRepository.findById(user.userId);
    if (!currentUser) {
      throw new NotFoundException(`User with ID ${user.userId} not found`);
    }

    if (!currentUser.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    const request = new ValidateRedemptionCodeRequest();
    request.code = body.code;
    request.tenantId = tenantId;
    // Incluir branchId si se proporciona en el body
    if (body.branchId) {
      request.branchId = body.branchId;
    }
    return this.validateRedemptionCodeHandler.execute(request, currentUser.id);
  }

  @Post('top-redeemed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener recompensas más canjeadas',
    description:
      'Obtiene las recompensas más canjeadas de un tenant en un período específico. ' +
      'Útil para el dashboard y análisis de popularidad de recompensas.',
  })
  @ApiParam({ name: 'tenantId', type: Number, description: 'ID del tenant' })
  @ApiBody({
    type: GetTopRedeemedRewardsBodyDto,
    description: 'Parámetros de consulta para obtener las recompensas más canjeadas',
    examples: {
      default: {
        summary: 'Consulta por período mensual',
        value: {
          limit: 5,
          period: 'month',
        },
      },
      custom: {
        summary: 'Consulta con fechas personalizadas',
        value: {
          limit: 10,
          startDate: '2026-01-01T00:00:00Z',
          endDate: '2026-01-31T23:59:59Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de recompensas más canjeadas',
    type: GetTopRedeemedRewardsResponse,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: BadRequestErrorResponseDto })
  @ApiResponse({ status: 401, description: 'No autenticado', type: UnauthorizedErrorResponseDto })
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
  async getTopRedeemedRewards(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @CurrentUser() _user: JwtPayload, // eslint-disable-line @typescript-eslint/no-unused-vars
    @Body() body: GetTopRedeemedRewardsBodyDto,
  ): Promise<GetTopRedeemedRewardsResponse> {
    const request = new GetTopRedeemedRewardsRequest();
    request.tenantId = tenantId;
    request.limit = body.limit || 5;
    request.period = body.period || 'month';
    if (body.startDate) {
      request.startDate = body.startDate;
    }
    if (body.endDate) {
      request.endDate = body.endDate;
    }
    return this.getTopRedeemedRewardsHandler.execute(request);
  }
}

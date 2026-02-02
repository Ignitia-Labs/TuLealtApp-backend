import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
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
} from '@libs/application';
import {
  JwtAuthGuard,
  RolesGuard,
  PartnerResourceGuard,
  Roles,
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
  async getRewards(
    @Param('tenantId', ParseIntPipe) tenantId: number,
  ): Promise<GetRewardsResponse> {
    const request = new GetRewardsRequest();
    request.tenantId = tenantId;
    return this.getRewardsHandler.execute(request);
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
  @ApiResponse({ status: 404, description: 'Recompensa no encontrada', type: NotFoundErrorResponseDto })
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
  @ApiResponse({ status: 404, description: 'Recompensa no encontrada', type: NotFoundErrorResponseDto })
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
  @ApiResponse({ status: 404, description: 'Recompensa no encontrada', type: NotFoundErrorResponseDto })
  async deleteReward(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('rewardId', ParseIntPipe) rewardId: number,
  ): Promise<void> {
    const request = new DeleteRewardRequest();
    request.tenantId = tenantId;
    request.rewardId = rewardId;
    return this.deleteRewardHandler.execute(request);
  }
}

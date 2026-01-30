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
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  GetRewardRulesHandler,
  GetRewardRulesRequest,
  GetRewardRulesResponse,
  GetRewardRuleHandler,
  GetRewardRuleRequest,
  GetRewardRuleResponse,
  CreateRewardRuleHandler,
  CreateRewardRuleRequest,
  CreateRewardRuleResponse,
  UpdateRewardRuleHandler,
  UpdateRewardRuleRequest,
  UpdateRewardRuleResponse,
  DeleteRewardRuleHandler,
  DeleteRewardRuleRequest,
} from '@libs/application';
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
import { JwtPayload } from '@libs/application';

/**
 * Controlador de reglas de recompensa para Partner API
 * Permite gestionar reglas de recompensa de los programas de lealtad
 */
@ApiTags('Reward Rules')
@Controller('tenants/:tenantId/loyalty-programs/:programId/reward-rules')
@UseGuards(JwtAuthGuard, RolesGuard, PartnerResourceGuard)
@Roles('PARTNER', 'PARTNER_STAFF', 'ADMIN', 'ADMIN_STAFF')
@ApiBearerAuth('JWT-auth')
export class RewardRulesController {
  constructor(
    private readonly getRewardRulesHandler: GetRewardRulesHandler,
    private readonly getRewardRuleHandler: GetRewardRuleHandler,
    private readonly createRewardRuleHandler: CreateRewardRuleHandler,
    private readonly updateRewardRuleHandler: UpdateRewardRuleHandler,
    private readonly deleteRewardRuleHandler: DeleteRewardRuleHandler,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar reglas de recompensa de un programa',
    description: 'Obtiene todas las reglas de recompensa de un programa con filtros opcionales',
  })
  @ApiParam({ name: 'tenantId', type: Number, description: 'ID del tenant' })
  @ApiParam({ name: 'programId', type: Number, description: 'ID del programa' })
  @ApiQuery({
    name: 'trigger',
    enum: ['VISIT', 'PURCHASE', 'REFERRAL', 'SUBSCRIPTION', 'RETENTION', 'CUSTOM', 'all'],
    required: false,
    description: 'Filtrar por trigger',
  })
  @ApiQuery({
    name: 'status',
    enum: ['active', 'inactive', 'all'],
    required: false,
    description: 'Filtrar por status',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de reglas de recompensa',
    type: GetRewardRulesResponse,
  })
  @ApiResponse({ status: 401, description: 'No autorizado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Prohibido', type: ForbiddenErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Programa no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async getRewardRules(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @Query('trigger')
    trigger?: 'VISIT' | 'PURCHASE' | 'REFERRAL' | 'SUBSCRIPTION' | 'RETENTION' | 'CUSTOM' | 'all',
    @Query('status') status?: 'active' | 'inactive' | 'all',
    @CurrentUser() user?: JwtPayload,
  ): Promise<GetRewardRulesResponse> {
    const request = new GetRewardRulesRequest();
    request.tenantId = tenantId;
    request.programId = programId;
    request.trigger = trigger || 'all';
    request.status = status || 'all';

    return this.getRewardRulesHandler.execute(request);
  }

  @Get(':ruleId')
  @ApiOperation({
    summary: 'Obtener regla de recompensa por ID',
    description: 'Obtiene detalles completos de una regla de recompensa',
  })
  @ApiParam({ name: 'tenantId', type: Number, description: 'ID del tenant' })
  @ApiParam({ name: 'programId', type: Number, description: 'ID del programa' })
  @ApiParam({ name: 'ruleId', type: Number, description: 'ID de la regla' })
  @ApiResponse({
    status: 200,
    description: 'Detalles de la regla de recompensa',
    type: GetRewardRuleResponse,
  })
  @ApiResponse({ status: 401, description: 'No autorizado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Prohibido', type: ForbiddenErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Regla no encontrada', type: NotFoundErrorResponseDto })
  async getRewardRule(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @Param('ruleId', ParseIntPipe) ruleId: number,
    @CurrentUser() user?: JwtPayload,
  ): Promise<GetRewardRuleResponse> {
    const request = new GetRewardRuleRequest();
    request.tenantId = tenantId;
    request.programId = programId;
    request.ruleId = ruleId;

    return this.getRewardRuleHandler.execute(request);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear regla de recompensa',
    description: 'Crea una nueva regla de recompensa para un programa',
  })
  @ApiParam({ name: 'tenantId', type: Number, description: 'ID del tenant' })
  @ApiParam({ name: 'programId', type: Number, description: 'ID del programa' })
  @ApiResponse({
    status: 201,
    description: 'Regla creada exitosamente',
    type: CreateRewardRuleResponse,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: BadRequestErrorResponseDto })
  @ApiResponse({ status: 401, description: 'No autorizado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Prohibido', type: ForbiddenErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Programa no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async createRewardRule(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @Body() body: CreateRewardRuleRequest,
    @CurrentUser() user?: JwtPayload,
  ): Promise<CreateRewardRuleResponse> {
    body.tenantId = tenantId;
    body.programId = programId;
    return this.createRewardRuleHandler.execute(body);
  }

  @Patch(':ruleId')
  @ApiOperation({
    summary: 'Actualizar regla de recompensa',
    description: 'Actualiza una regla de recompensa existente (actualización parcial)',
  })
  @ApiParam({ name: 'tenantId', type: Number, description: 'ID del tenant' })
  @ApiParam({ name: 'programId', type: Number, description: 'ID del programa' })
  @ApiParam({ name: 'ruleId', type: Number, description: 'ID de la regla' })
  @ApiResponse({
    status: 200,
    description: 'Regla actualizada exitosamente',
    type: UpdateRewardRuleResponse,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: BadRequestErrorResponseDto })
  @ApiResponse({ status: 401, description: 'No autorizado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Prohibido', type: ForbiddenErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Regla no encontrada', type: NotFoundErrorResponseDto })
  async updateRewardRule(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @Param('ruleId', ParseIntPipe) ruleId: number,
    @Body() body: Partial<UpdateRewardRuleRequest>,
    @CurrentUser() user?: JwtPayload,
  ): Promise<UpdateRewardRuleResponse> {
    const request = new UpdateRewardRuleRequest();
    request.tenantId = tenantId;
    request.programId = programId;
    request.ruleId = ruleId;
    Object.assign(request, body);

    return this.updateRewardRuleHandler.execute(request);
  }

  @Delete(':ruleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar regla de recompensa',
    description: 'Elimina una regla de recompensa (solo si no está activa)',
  })
  @ApiParam({ name: 'tenantId', type: Number, description: 'ID del tenant' })
  @ApiParam({ name: 'programId', type: Number, description: 'ID del programa' })
  @ApiParam({ name: 'ruleId', type: Number, description: 'ID de la regla' })
  @ApiResponse({ status: 204, description: 'Regla eliminada exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar (está activa)',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Prohibido', type: ForbiddenErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Regla no encontrada', type: NotFoundErrorResponseDto })
  async deleteRewardRule(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @Param('ruleId', ParseIntPipe) ruleId: number,
    @CurrentUser() user?: JwtPayload,
  ): Promise<void> {
    const request = new DeleteRewardRuleRequest();
    request.tenantId = tenantId;
    request.programId = programId;
    request.ruleId = ruleId;

    return this.deleteRewardRuleHandler.execute(request);
  }
}

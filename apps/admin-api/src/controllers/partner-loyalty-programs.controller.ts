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
  GetLoyaltyProgramsHandler,
  GetLoyaltyProgramsRequest,
  GetLoyaltyProgramsResponse,
  GetLoyaltyProgramHandler,
  GetLoyaltyProgramRequest,
  GetLoyaltyProgramResponse,
  CreateLoyaltyProgramHandler,
  CreateLoyaltyProgramRequest,
  CreateLoyaltyProgramResponse,
  UpdateLoyaltyProgramHandler,
  UpdateLoyaltyProgramRequest,
  UpdateLoyaltyProgramResponse,
  DeleteLoyaltyProgramHandler,
  DeleteLoyaltyProgramRequest,
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
  GetEnrollmentsHandler,
  GetEnrollmentsRequest,
  GetEnrollmentsResponse,
  CreateEnrollmentHandler,
  CreateEnrollmentRequest,
  CreateEnrollmentResponse,
  DeleteEnrollmentHandler,
  DeleteEnrollmentRequest,
  GetLoyaltyDashboardHandler,
  GetLoyaltyDashboardRequest,
  GetLoyaltyDashboardResponse,
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
 * Controlador para gestionar loyalty programs de partners desde Admin API
 * Permite a los administradores gestionar todos los aspectos de los programas de lealtad
 * que los partners pueden gestionar desde Partner-UI
 */
@ApiTags('Partner Loyalty Programs')
@Controller('partners/:partnerId/tenants/:tenantId/loyalty-programs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ADMIN_STAFF', 'WEBMASTER')
@ApiBearerAuth('JWT-auth')
export class PartnerLoyaltyProgramsController {
  constructor(
    private readonly getLoyaltyProgramsHandler: GetLoyaltyProgramsHandler,
    private readonly getLoyaltyProgramHandler: GetLoyaltyProgramHandler,
    private readonly createLoyaltyProgramHandler: CreateLoyaltyProgramHandler,
    private readonly updateLoyaltyProgramHandler: UpdateLoyaltyProgramHandler,
    private readonly deleteLoyaltyProgramHandler: DeleteLoyaltyProgramHandler,
    private readonly getRewardRulesHandler: GetRewardRulesHandler,
    private readonly getRewardRuleHandler: GetRewardRuleHandler,
    private readonly createRewardRuleHandler: CreateRewardRuleHandler,
    private readonly updateRewardRuleHandler: UpdateRewardRuleHandler,
    private readonly deleteRewardRuleHandler: DeleteRewardRuleHandler,
    private readonly getEnrollmentsHandler: GetEnrollmentsHandler,
    private readonly createEnrollmentHandler: CreateEnrollmentHandler,
    private readonly deleteEnrollmentHandler: DeleteEnrollmentHandler,
    private readonly getLoyaltyDashboardHandler: GetLoyaltyDashboardHandler,
  ) {}

  // ============================================
  // LOYALTY PROGRAMS
  // ============================================

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar programas de lealtad de un tenant',
    description: 'Obtiene todos los programas de lealtad de un tenant del partner',
  })
  @ApiParam({ name: 'partnerId', type: Number, description: 'ID del partner' })
  @ApiParam({ name: 'tenantId', type: Number, description: 'ID del tenant' })
  @ApiQuery({
    name: 'status',
    enum: ['active', 'inactive', 'all'],
    required: false,
    description: 'Filtrar por status',
  })
  @ApiQuery({
    name: 'programType',
    enum: ['BASE', 'PROMO', 'PARTNER', 'SUBSCRIPTION', 'EXPERIMENTAL', 'all'],
    required: false,
    description: 'Filtrar por tipo de programa',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de programas obtenida exitosamente',
    type: GetLoyaltyProgramsResponse,
  })
  async getLoyaltyPrograms(
    @Param('partnerId', ParseIntPipe) partnerId: number,
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Query('status') status?: string,
    @Query('programType') programType?: string,
  ): Promise<GetLoyaltyProgramsResponse> {
    const request = new GetLoyaltyProgramsRequest();
    request.tenantId = tenantId;
    request.status = (status as any) || 'all';
    request.programType = (programType as any) || 'all';
    return this.getLoyaltyProgramsHandler.execute(request);
  }

  @Get(':programId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener programa de lealtad por ID',
    description: 'Obtiene detalles completos de un programa de lealtad',
  })
  @ApiParam({ name: 'partnerId', type: Number })
  @ApiParam({ name: 'tenantId', type: Number })
  @ApiParam({ name: 'programId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Programa obtenido exitosamente',
    type: GetLoyaltyProgramResponse,
  })
  async getLoyaltyProgram(
    @Param('partnerId', ParseIntPipe) partnerId: number,
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('programId', ParseIntPipe) programId: number,
  ): Promise<GetLoyaltyProgramResponse> {
    const request = new GetLoyaltyProgramRequest();
    request.tenantId = tenantId;
    request.programId = programId;
    return this.getLoyaltyProgramHandler.execute(request);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear programa de lealtad',
    description: 'Crea un nuevo programa de lealtad para el tenant',
  })
  @ApiParam({ name: 'partnerId', type: Number })
  @ApiParam({ name: 'tenantId', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Programa creado exitosamente',
    type: CreateLoyaltyProgramResponse,
  })
  async createLoyaltyProgram(
    @Param('partnerId', ParseIntPipe) partnerId: number,
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body() body: CreateLoyaltyProgramRequest,
  ): Promise<CreateLoyaltyProgramResponse> {
    const request = new CreateLoyaltyProgramRequest();
    request.tenantId = tenantId;
    Object.assign(request, body);
    return this.createLoyaltyProgramHandler.execute(request);
  }

  @Patch(':programId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar programa de lealtad',
    description: 'Actualiza un programa de lealtad existente',
  })
  @ApiParam({ name: 'partnerId', type: Number })
  @ApiParam({ name: 'tenantId', type: Number })
  @ApiParam({ name: 'programId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Programa actualizado exitosamente',
    type: UpdateLoyaltyProgramResponse,
  })
  async updateLoyaltyProgram(
    @Param('partnerId', ParseIntPipe) partnerId: number,
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @Body() body: UpdateLoyaltyProgramRequest,
  ): Promise<UpdateLoyaltyProgramResponse> {
    const request = new UpdateLoyaltyProgramRequest();
    request.tenantId = tenantId;
    request.programId = programId;
    Object.assign(request, body);
    return this.updateLoyaltyProgramHandler.execute(request);
  }

  @Delete(':programId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar programa de lealtad',
    description: 'Elimina un programa de lealtad',
  })
  @ApiParam({ name: 'partnerId', type: Number })
  @ApiParam({ name: 'tenantId', type: Number })
  @ApiParam({ name: 'programId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Programa eliminado exitosamente',
  })
  async deleteLoyaltyProgram(
    @Param('partnerId', ParseIntPipe) partnerId: number,
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('programId', ParseIntPipe) programId: number,
  ): Promise<void> {
    const request = new DeleteLoyaltyProgramRequest();
    request.tenantId = tenantId;
    request.programId = programId;
    await this.deleteLoyaltyProgramHandler.execute(request);
  }

  // ============================================
  // REWARD RULES
  // ============================================

  @Get(':programId/reward-rules')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar reglas de recompensa de un programa',
    description: 'Obtiene todas las reglas de recompensa de un programa',
  })
  @ApiParam({ name: 'partnerId', type: Number })
  @ApiParam({ name: 'tenantId', type: Number })
  @ApiParam({ name: 'programId', type: Number })
  @ApiQuery({
    name: 'trigger',
    enum: ['VISIT', 'PURCHASE', 'REFERRAL', 'SUBSCRIPTION', 'RETENTION', 'CUSTOM', 'all'],
    required: false,
  })
  @ApiQuery({
    name: 'status',
    enum: ['active', 'inactive', 'all'],
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de reglas obtenida exitosamente',
    type: GetRewardRulesResponse,
  })
  async getRewardRules(
    @Param('partnerId', ParseIntPipe) partnerId: number,
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @Query('trigger') trigger?: string,
    @Query('status') status?: string,
  ): Promise<GetRewardRulesResponse> {
    const request = new GetRewardRulesRequest();
    request.programId = programId;
    request.trigger = (trigger as any) || 'all';
    request.status = (status as any) || 'all';
    return this.getRewardRulesHandler.execute(request);
  }

  @Get(':programId/reward-rules/:ruleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener regla de recompensa por ID',
    description: 'Obtiene detalles completos de una regla de recompensa',
  })
  @ApiParam({ name: 'partnerId', type: Number })
  @ApiParam({ name: 'tenantId', type: Number })
  @ApiParam({ name: 'programId', type: Number })
  @ApiParam({ name: 'ruleId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Regla obtenida exitosamente',
    type: GetRewardRuleResponse,
  })
  async getRewardRule(
    @Param('partnerId', ParseIntPipe) partnerId: number,
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @Param('ruleId', ParseIntPipe) ruleId: number,
  ): Promise<GetRewardRuleResponse> {
    const request = new GetRewardRuleRequest();
    request.programId = programId;
    request.ruleId = ruleId;
    return this.getRewardRuleHandler.execute(request);
  }

  @Post(':programId/reward-rules')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear regla de recompensa',
    description: 'Crea una nueva regla de recompensa para el programa',
  })
  @ApiParam({ name: 'partnerId', type: Number })
  @ApiParam({ name: 'tenantId', type: Number })
  @ApiParam({ name: 'programId', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Regla creada exitosamente',
    type: CreateRewardRuleResponse,
  })
  async createRewardRule(
    @Param('partnerId', ParseIntPipe) partnerId: number,
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @Body() body: CreateRewardRuleRequest,
  ): Promise<CreateRewardRuleResponse> {
    const request = new CreateRewardRuleRequest();
    request.programId = programId;
    Object.assign(request, body);
    return this.createRewardRuleHandler.execute(request);
  }

  @Patch(':programId/reward-rules/:ruleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar regla de recompensa',
    description: 'Actualiza una regla de recompensa existente',
  })
  @ApiParam({ name: 'partnerId', type: Number })
  @ApiParam({ name: 'tenantId', type: Number })
  @ApiParam({ name: 'programId', type: Number })
  @ApiParam({ name: 'ruleId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Regla actualizada exitosamente',
    type: UpdateRewardRuleResponse,
  })
  async updateRewardRule(
    @Param('partnerId', ParseIntPipe) partnerId: number,
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @Param('ruleId', ParseIntPipe) ruleId: number,
    @Body() body: UpdateRewardRuleRequest,
  ): Promise<UpdateRewardRuleResponse> {
    const request = new UpdateRewardRuleRequest();
    request.programId = programId;
    request.ruleId = ruleId;
    Object.assign(request, body);
    return this.updateRewardRuleHandler.execute(request);
  }

  @Delete(':programId/reward-rules/:ruleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar regla de recompensa',
    description: 'Elimina una regla de recompensa',
  })
  @ApiParam({ name: 'partnerId', type: Number })
  @ApiParam({ name: 'tenantId', type: Number })
  @ApiParam({ name: 'programId', type: Number })
  @ApiParam({ name: 'ruleId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Regla eliminada exitosamente',
  })
  async deleteRewardRule(
    @Param('partnerId', ParseIntPipe) partnerId: number,
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @Param('ruleId', ParseIntPipe) ruleId: number,
  ): Promise<void> {
    const request = new DeleteRewardRuleRequest();
    request.programId = programId;
    request.ruleId = ruleId;
    await this.deleteRewardRuleHandler.execute(request);
  }

  // ============================================
  // ENROLLMENTS
  // ============================================

  @Get(':programId/enrollments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar enrollments de un programa',
    description: 'Obtiene todas las inscripciones activas de un programa',
  })
  @ApiParam({ name: 'partnerId', type: Number })
  @ApiParam({ name: 'tenantId', type: Number })
  @ApiParam({ name: 'programId', type: Number })
  @ApiQuery({
    name: 'status',
    enum: ['active', 'inactive', 'all'],
    required: false,
  })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({
    status: 200,
    description: 'Lista de enrollments obtenida exitosamente',
    type: GetEnrollmentsResponse,
  })
  async getEnrollments(
    @Param('partnerId', ParseIntPipe) partnerId: number,
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<GetEnrollmentsResponse> {
    const request = new GetEnrollmentsRequest();
    request.programId = programId;
    request.status = (status as any) || 'active';
    request.page = page || 1;
    request.limit = limit || 20;
    return this.getEnrollmentsHandler.execute(request);
  }

  @Post(':programId/enrollments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Inscribir customer en programa',
    description: 'Inscribe un customer en un programa de lealtad',
  })
  @ApiParam({ name: 'partnerId', type: Number })
  @ApiParam({ name: 'tenantId', type: Number })
  @ApiParam({ name: 'programId', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Customer inscrito exitosamente',
    type: CreateEnrollmentResponse,
  })
  async createEnrollment(
    @Param('partnerId', ParseIntPipe) partnerId: number,
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @Body() body: CreateEnrollmentRequest,
  ): Promise<CreateEnrollmentResponse> {
    const request = new CreateEnrollmentRequest();
    request.programId = programId;
    Object.assign(request, body);
    return this.createEnrollmentHandler.execute(request);
  }

  @Delete(':programId/enrollments/:enrollmentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desinscribir customer de programa',
    description: 'Desinscribe un customer de un programa',
  })
  @ApiParam({ name: 'partnerId', type: Number })
  @ApiParam({ name: 'tenantId', type: Number })
  @ApiParam({ name: 'programId', type: Number })
  @ApiParam({ name: 'enrollmentId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Customer desinscrito exitosamente',
  })
  async deleteEnrollment(
    @Param('partnerId', ParseIntPipe) partnerId: number,
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @Param('enrollmentId', ParseIntPipe) enrollmentId: number,
  ): Promise<void> {
    const request = new DeleteEnrollmentRequest();
    request.programId = programId;
    request.enrollmentId = enrollmentId;
    await this.deleteEnrollmentHandler.execute(request);
  }

  // ============================================
  // DASHBOARD
  // ============================================

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dashboard de lealtad',
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
}

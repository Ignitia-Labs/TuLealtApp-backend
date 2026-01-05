import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  GetPointsRulesHandler,
  GetPointsRulesRequest,
  GetPointsRulesResponse,
  CreatePointsRuleHandler,
  CreatePointsRuleRequest,
  CreatePointsRuleResponse,
  UpdatePointsRuleHandler,
  UpdatePointsRuleRequest,
  UpdatePointsRuleResponse,
  DeletePointsRuleHandler,
  DeletePointsRuleRequest,
  DeletePointsRuleResponse,
  JwtPayload,
} from '@libs/application';
import {
  BadRequestErrorResponseDto,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  InternalServerErrorResponseDto,
  JwtAuthGuard,
  RolesGuard,
  PartnerResourceGuard,
  Roles,
  CurrentUser,
} from '@libs/shared';
import { IUserRepository, ITenantRepository, IPointsRuleRepository } from '@libs/domain';

/**
 * Controlador de Points Rules para Partner API
 * Permite gestionar las reglas de puntos de los tenants del partner autenticado
 *
 * Endpoints:
 * - GET /partner/tenants/:tenantId/points-rules - Listar reglas de puntos por tenant
 * - POST /partner/tenants/:tenantId/points-rules - Crear una nueva regla de puntos
 * - PUT/PATCH /partner/tenants/:tenantId/points-rules/:ruleId - Actualizar regla de puntos
 * - DELETE /partner/tenants/:tenantId/points-rules/:ruleId - Eliminar regla de puntos
 */
@ApiTags('Partner Points Rules')
@Controller('tenants/:tenantId/points-rules')
@UseGuards(JwtAuthGuard, RolesGuard, PartnerResourceGuard)
@Roles('PARTNER', 'PARTNER_STAFF', 'ADMIN', 'ADMIN_STAFF')
@ApiBearerAuth('JWT-auth')
export class PointsRulesController {
  constructor(
    private readonly getPointsRulesHandler: GetPointsRulesHandler,
    private readonly createPointsRuleHandler: CreatePointsRuleHandler,
    private readonly updatePointsRuleHandler: UpdatePointsRuleHandler,
    private readonly deletePointsRuleHandler: DeletePointsRuleHandler,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IPointsRuleRepository')
    private readonly pointsRuleRepository: IPointsRuleRepository,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar reglas de puntos por tenant',
    description:
      'Obtiene la lista de todas las reglas de puntos asociadas a un tenant específico. El tenant debe pertenecer al partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF).',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de reglas de puntos obtenida exitosamente',
    type: GetPointsRulesResponse,
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
  async getPointsRules(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<GetPointsRulesResponse> {
    // Validar ownership del tenant
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    // Para ADMIN/ADMIN_STAFF, permitir acceso a cualquier recurso
    const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('ADMIN_STAFF');
    if (!isAdmin) {
      const userEntity = await this.userRepository.findById(user.userId);
      if (!userEntity || !userEntity.partnerId) {
        throw new ForbiddenException('User does not belong to a partner');
      }

      if (tenant.partnerId !== userEntity.partnerId) {
        throw new ForbiddenException('You can only access points rules from tenants of your partner');
      }
    }

    const request = new GetPointsRulesRequest();
    request.tenantId = tenantId;

    return this.getPointsRulesHandler.execute(request);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nueva regla de puntos',
    description:
      'Crea una nueva regla de puntos asociada a un tenant específico. El tenant debe pertenecer al partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF).',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiBody({
    type: CreatePointsRuleRequest,
    description: 'Datos de la regla de puntos a crear',
  })
  @ApiResponse({
    status: 201,
    description: 'Regla de puntos creada exitosamente',
    type: CreatePointsRuleResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
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
  async createPointsRule(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body() request: CreatePointsRuleRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<CreatePointsRuleResponse> {
    // Validar ownership del tenant
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    // Para ADMIN/ADMIN_STAFF, permitir acceso a cualquier recurso
    const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('ADMIN_STAFF');
    if (!isAdmin) {
      const userEntity = await this.userRepository.findById(user.userId);
      if (!userEntity || !userEntity.partnerId) {
        throw new ForbiddenException('User does not belong to a partner');
      }

      if (tenant.partnerId !== userEntity.partnerId) {
        throw new ForbiddenException('You can only create points rules for tenants from your partner');
      }
    }

    // Asignar tenantId al request (sobrescribir si viene en el body)
    request.tenantId = tenantId;

    return this.createPointsRuleHandler.execute(request);
  }

  @Put(':ruleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar regla de puntos (PUT)',
    description:
      'Actualiza una regla de puntos existente. La regla debe pertenecer al tenant especificado y el tenant debe pertenecer al partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF).',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiParam({
    name: 'ruleId',
    type: Number,
    description: 'ID de la regla de puntos',
    example: 1,
  })
  @ApiBody({
    type: UpdatePointsRuleRequest,
    description: 'Datos de la regla de puntos a actualizar',
  })
  @ApiResponse({
    status: 200,
    description: 'Regla de puntos actualizada exitosamente',
    type: UpdatePointsRuleResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o la regla no pertenece al tenant especificado',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant o regla no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async updatePointsRulePut(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('ruleId', ParseIntPipe) ruleId: number,
    @Body() request: UpdatePointsRuleRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<UpdatePointsRuleResponse> {
    return this.updatePointsRule(tenantId, ruleId, request, user);
  }

  @Patch(':ruleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar regla de puntos (PATCH)',
    description:
      'Actualiza una regla de puntos existente (actualización parcial). La regla debe pertenecer al tenant especificado y el tenant debe pertenecer al partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF).',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiParam({
    name: 'ruleId',
    type: Number,
    description: 'ID de la regla de puntos',
    example: 1,
  })
  @ApiBody({
    type: UpdatePointsRuleRequest,
    description: 'Datos de la regla de puntos a actualizar (campos opcionales)',
  })
  @ApiResponse({
    status: 200,
    description: 'Regla de puntos actualizada exitosamente',
    type: UpdatePointsRuleResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o la regla no pertenece al tenant especificado',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant o regla no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async updatePointsRulePatch(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('ruleId', ParseIntPipe) ruleId: number,
    @Body() request: UpdatePointsRuleRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<UpdatePointsRuleResponse> {
    return this.updatePointsRule(tenantId, ruleId, request, user);
  }

  /**
   * Método privado compartido para actualizar reglas (usado por PUT y PATCH)
   */
  private async updatePointsRule(
    tenantId: number,
    ruleId: number,
    request: UpdatePointsRuleRequest,
    user: JwtPayload,
  ): Promise<UpdatePointsRuleResponse> {
    // Validar ownership del tenant
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    // Para ADMIN/ADMIN_STAFF, permitir acceso a cualquier recurso
    const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('ADMIN_STAFF');
    if (!isAdmin) {
      const userEntity = await this.userRepository.findById(user.userId);
      if (!userEntity || !userEntity.partnerId) {
        throw new ForbiddenException('User does not belong to a partner');
      }

      if (tenant.partnerId !== userEntity.partnerId) {
        throw new ForbiddenException('You can only update points rules from tenants of your partner');
      }
    }

    // Validar que la regla existe y pertenece al tenant especificado
    const rule = await this.pointsRuleRepository.findById(ruleId);
    if (!rule) {
      throw new NotFoundException(`Points rule with ID ${ruleId} not found`);
    }

    if (rule.tenantId !== tenantId) {
      throw new ForbiddenException(
        `Points rule with ID ${ruleId} does not belong to tenant with ID ${tenantId}`,
      );
    }

    return this.updatePointsRuleHandler.execute(ruleId, request);
  }

  @Delete(':ruleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar regla de puntos',
    description:
      'Elimina una regla de puntos existente. La regla debe pertenecer al tenant especificado y el tenant debe pertenecer al partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF).',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiParam({
    name: 'ruleId',
    type: Number,
    description: 'ID de la regla de puntos',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Regla de puntos eliminada exitosamente',
    type: DeletePointsRuleResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o la regla no pertenece al tenant especificado',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant o regla no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async deletePointsRule(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('ruleId', ParseIntPipe) ruleId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<DeletePointsRuleResponse> {
    // Validar ownership del tenant
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    // Para ADMIN/ADMIN_STAFF, permitir acceso a cualquier recurso
    const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('ADMIN_STAFF');
    if (!isAdmin) {
      const userEntity = await this.userRepository.findById(user.userId);
      if (!userEntity || !userEntity.partnerId) {
        throw new ForbiddenException('User does not belong to a partner');
      }

      if (tenant.partnerId !== userEntity.partnerId) {
        throw new ForbiddenException('You can only delete points rules from tenants of your partner');
      }
    }

    // Validar que la regla existe y pertenece al tenant especificado
    const rule = await this.pointsRuleRepository.findById(ruleId);
    if (!rule) {
      throw new NotFoundException(`Points rule with ID ${ruleId} not found`);
    }

    if (rule.tenantId !== tenantId) {
      throw new ForbiddenException(
        `Points rule with ID ${ruleId} does not belong to tenant with ID ${tenantId}`,
      );
    }

    const request = new DeletePointsRuleRequest();
    request.pointsRuleId = ruleId;

    return this.deletePointsRuleHandler.execute(request);
  }
}


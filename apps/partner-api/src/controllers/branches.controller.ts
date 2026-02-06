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
  ForbiddenException,
  BadRequestException,
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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateBranchHandler,
  CreateBranchRequest,
  CreateBranchResponse,
  GetBranchHandler,
  GetBranchRequest,
  GetBranchResponse,
  GetBranchesByTenantHandler,
  GetBranchesByTenantRequest,
  GetBranchesByTenantResponse,
  UpdateBranchHandler,
  UpdateBranchRequest,
  UpdateBranchResponse,
  DeleteBranchHandler,
  DeleteBranchRequest,
  DeleteBranchResponse,
  GetAllBranchesMetricsHandler,
  GetAllBranchesMetricsRequest,
  GetAllBranchesMetricsResponse,
  GetCrossBranchInsightsHandler,
  GetCrossBranchInsightsRequest,
  GetCrossBranchInsightsResponse,
  JwtPayload,
} from '@libs/application';
import {
  IUserRepository,
  ITenantRepository,
  IBranchRepository,
  IPricingPlanRepository,
} from '@libs/domain';
import { PartnerSubscriptionEntity, PartnerSubscriptionUsageEntity } from '@libs/infrastructure';
import { SubscriptionUsageHelper } from '@libs/application';
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
 * Controlador de branches para Partner API
 * Permite gestionar branches de los tenants del partner autenticado
 *
 * Endpoints:
 * - GET /partner/tenants/:tenantId/branches - Listar branches de un tenant (validando ownership)
 * - GET /partner/branches/:id - Obtener branch por ID (validando ownership)
 * - POST /partner/tenants/:tenantId/branches - Crear nueva branch en un tenant (validando ownership)
 * - PATCH /partner/branches/:id - Actualizar branch (validando ownership)
 * - DELETE /partner/branches/:id - Eliminar branch (validando ownership)
 */
@ApiTags('Branches')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, PartnerResourceGuard)
@Roles('PARTNER', 'PARTNER_STAFF', 'ADMIN', 'ADMIN_STAFF')
@ApiBearerAuth('JWT-auth')
export class BranchesController {
  constructor(
    private readonly createBranchHandler: CreateBranchHandler,
    private readonly getBranchHandler: GetBranchHandler,
    private readonly getBranchesByTenantHandler: GetBranchesByTenantHandler,
    private readonly updateBranchHandler: UpdateBranchHandler,
    private readonly deleteBranchHandler: DeleteBranchHandler,
    private readonly getAllBranchesMetricsHandler: GetAllBranchesMetricsHandler,
    private readonly getCrossBranchInsightsHandler: GetCrossBranchInsightsHandler,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
    @Inject('IPricingPlanRepository')
    private readonly pricingPlanRepository: IPricingPlanRepository,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    @InjectRepository(PartnerSubscriptionUsageEntity)
    private readonly usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ) {}

  @Get('tenants/:tenantId/branches')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar branches de un tenant',
    description:
      'Obtiene la lista de todas las branches asociadas a un tenant específico. El tenant debe pertenecer al partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF).',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de branches obtenida exitosamente',
    type: GetBranchesByTenantResponse,
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
  async getBranchesByTenant(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<GetBranchesByTenantResponse> {
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
        throw new ForbiddenException('You can only access branches from tenants of your partner');
      }
    }

    const request = new GetBranchesByTenantRequest();
    request.tenantId = tenantId;

    return this.getBranchesByTenantHandler.execute(request);
  }

  @Get('branches/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener branch por ID',
    description:
      'Obtiene la información de una branch específica. La branch debe pertenecer a un tenant del partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la branch',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Branch obtenida exitosamente',
    type: GetBranchResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o la branch no pertenece a su partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Branch no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async getBranch(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<GetBranchResponse> {
    const request = new GetBranchRequest();
    request.branchId = id;

    return this.getBranchHandler.execute(request);
  }

  @Post('tenants/:tenantId/branches')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nueva branch',
    description:
      'Crea una nueva branch en un tenant específico. Valida que el tenant pertenezca al partner del usuario y que el partner no haya excedido el límite de branches permitidas por su plan.',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiBody({
    type: CreateBranchRequest,
    description: 'Datos de la branch a crear',
  })
  @ApiResponse({
    status: 201,
    description: 'Branch creada exitosamente',
    type: CreateBranchResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o límite de branches excedido',
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
  async createBranch(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body() request: CreateBranchRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<CreateBranchResponse> {
    // Para ADMIN/ADMIN_STAFF, permitir acceso a cualquier recurso sin validar partnerId
    const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('ADMIN_STAFF');

    // 1. Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    // 2. Para usuarios no-admin, validar ownership del tenant
    if (!isAdmin) {
      const userEntity = await this.userRepository.findById(user.userId);
      if (!userEntity || !userEntity.partnerId) {
        throw new ForbiddenException('User does not belong to a partner');
      }
      const userPartnerId = userEntity.partnerId;

      if (tenant.partnerId !== userPartnerId) {
        throw new ForbiddenException('You can only create branches for tenants from your partner');
      }
    }

    // 3. Obtener límites del plan desde pricing_plan_limits
    const planLimits = await SubscriptionUsageHelper.getPlanLimitsForPartner(
      tenant.partnerId,
      this.subscriptionRepository,
      this.pricingPlanRepository,
    );

    if (!planLimits) {
      throw new NotFoundException(
        `Pricing plan limits not found for partner with ID ${tenant.partnerId}. Please ensure the partner has an active subscription.`,
      );
    }

    // 4. Obtener uso actual desde subscription_usage
    const usage = await SubscriptionUsageHelper.getCurrentUsageForPartner(
      tenant.partnerId,
      this.subscriptionRepository,
      this.usageRepository,
    );

    // 5. Validar límites usando el método de dominio
    if (!planLimits.canCreateBranch(usage.branchesCount)) {
      throw new BadRequestException(
        `Maximum number of branches reached for your plan. Current: ${usage.branchesCount}, Maximum: ${planLimits.maxBranches === -1 ? 'unlimited' : planLimits.maxBranches}`,
      );
    }

    // 6. Asignar tenantId al request y crear branch
    request.tenantId = tenantId;
    return this.createBranchHandler.execute(request);
  }

  @Patch('branches/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar branch',
    description:
      'Actualiza una branch existente. La branch debe pertenecer a un tenant del partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF). Permite actualización parcial (PATCH).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la branch',
    example: 1,
  })
  @ApiBody({
    type: UpdateBranchRequest,
    description: 'Datos de la branch a actualizar (campos opcionales)',
  })
  @ApiResponse({
    status: 200,
    description: 'Branch actualizada exitosamente',
    type: UpdateBranchResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o la branch no pertenece a su partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Branch no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async updateBranch(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateBranchRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<UpdateBranchResponse> {
    return this.updateBranchHandler.execute(id, request);
  }

  @Delete('branches/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar branch',
    description:
      'Elimina una branch existente. La branch debe pertenecer a un tenant del partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la branch',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Branch eliminada exitosamente',
    type: DeleteBranchResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o la branch no pertenece a su partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Branch no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async deleteBranch(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<DeleteBranchResponse> {
    const request = new DeleteBranchRequest();
    request.branchId = id;

    return this.deleteBranchHandler.execute(request);
  }

  @Get('tenants/:tenantId/branches/metrics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener métricas de todas las sucursales',
    description:
      'Obtiene métricas agregadas de revenue, clientes y recompensas para todas las sucursales de un tenant específico. Incluye filtros por período de tiempo.',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas obtenidas exitosamente',
    type: GetAllBranchesMetricsResponse,
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
  async getAllBranchesMetrics(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Query() query: Partial<GetAllBranchesMetricsRequest>,
    @CurrentUser() user: JwtPayload,
  ): Promise<GetAllBranchesMetricsResponse> {
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
        throw new ForbiddenException('You can only access metrics from tenants of your partner');
      }
    }

    const request = new GetAllBranchesMetricsRequest();
    request.tenantId = tenantId;
    request.period = query.period;
    request.startDate = query.startDate;
    request.endDate = query.endDate;

    return this.getAllBranchesMetricsHandler.execute(request);
  }

  @Get('tenants/:tenantId/branches/cross-insights')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener insights de clientes cross-branch',
    description:
      'Analiza patrones de clientes que visitan múltiples sucursales. Incluye combinaciones más populares, ' +
      'revenue uplift y recomendaciones automáticas.',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Cross-branch insights obtenidos exitosamente',
    type: GetCrossBranchInsightsResponse,
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
  async getCrossBranchInsights(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Query() query: Partial<GetCrossBranchInsightsRequest>,
    @CurrentUser() user: JwtPayload,
  ): Promise<GetCrossBranchInsightsResponse> {
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
        throw new ForbiddenException(
          'You can only access cross-branch insights from tenants of your partner',
        );
      }
    }

    const request = new GetCrossBranchInsightsRequest();
    request.tenantId = tenantId;
    request.period = query.period;
    request.startDate = query.startDate;
    request.endDate = query.endDate;

    return this.getCrossBranchInsightsHandler.execute(request);
  }
}

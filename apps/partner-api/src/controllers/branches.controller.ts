import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
  JwtPayload,
} from '@libs/application';
import { IUserRepository, ITenantRepository, IBranchRepository, PartnerLimits } from '@libs/domain';
import { PartnerLimitsEntity, PartnerMapper } from '@libs/infrastructure';
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
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
    @InjectRepository(PartnerLimitsEntity)
    private readonly partnerLimitsRepository: Repository<PartnerLimitsEntity>,
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

    // 3. Obtener límites del partner desde partner_limits
    const limitsEntity = await this.partnerLimitsRepository.findOne({
      where: { partnerId: tenant.partnerId },
    });

    if (!limitsEntity) {
      throw new NotFoundException(`Limits for partner with ID ${tenant.partnerId} not found`);
    }

    // 4. Contar branches TOTALES del partner (suma de todas las branches de todos sus tenants)
    const partnerTenants = await this.tenantRepository.findByPartnerId(tenant.partnerId);
    let totalBranchesCount = 0;

    for (const t of partnerTenants) {
      const branches = await this.branchRepository.findByTenantId(t.id);
      totalBranchesCount += branches.length;
    }

    // 5. Validar límites usando el método de dominio
    const partnerLimits = PartnerLimits.create(
      limitsEntity.partnerId,
      limitsEntity.maxTenants,
      limitsEntity.maxBranches,
      limitsEntity.maxCustomers,
      limitsEntity.maxRewards,
      limitsEntity.id,
    );

    if (!partnerLimits.canCreateBranch(totalBranchesCount)) {
      throw new BadRequestException(
        `Maximum number of branches reached for your plan. Current: ${totalBranchesCount}, Maximum: ${limitsEntity.maxBranches}`,
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
}

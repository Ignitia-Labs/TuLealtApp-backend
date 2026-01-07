import {
  Controller,
  Get,
  Post,
  Put,
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
  NotFoundException,
  Inject,
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
  GetRewardsHandler,
  GetRewardsRequest,
  GetRewardsResponse,
  GetRewardHandler,
  GetRewardRequest,
  GetRewardResponse,
  CreateRewardHandler,
  CreateRewardRequest,
  CreateRewardResponse,
  UpdateRewardHandler,
  UpdateRewardRequest,
  UpdateRewardResponse,
  DeleteRewardHandler,
  DeleteRewardRequest,
  DeleteRewardResponse,
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
import { IUserRepository, ITenantRepository, IRewardRepository } from '@libs/domain';

/**
 * Controlador de Rewards para Partner API
 * Permite gestionar las recompensas de los tenants del partner autenticado
 *
 * Endpoints:
 * - GET /partner/tenants/:tenantId/rewards - Listar recompensas por tenant
 * - GET /partner/rewards/:id - Obtener recompensa por ID
 * - POST /partner/tenants/:tenantId/rewards - Crear una nueva recompensa
 * - PUT/PATCH /partner/rewards/:id - Actualizar recompensa
 * - DELETE /partner/rewards/:id - Eliminar recompensa
 */
@ApiTags('Partner Rewards')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, PartnerResourceGuard)
@Roles('PARTNER', 'PARTNER_STAFF', 'ADMIN', 'ADMIN_STAFF')
@ApiBearerAuth('JWT-auth')
export class RewardsController {
  constructor(
    private readonly getRewardsHandler: GetRewardsHandler,
    private readonly getRewardHandler: GetRewardHandler,
    private readonly createRewardHandler: CreateRewardHandler,
    private readonly updateRewardHandler: UpdateRewardHandler,
    private readonly deleteRewardHandler: DeleteRewardHandler,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IRewardRepository')
    private readonly rewardRepository: IRewardRepository,
  ) {}

  @Get('tenants/:tenantId/rewards')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar recompensas por tenant',
    description:
      'Obtiene la lista de todas las recompensas asociadas a un tenant específico. El tenant debe pertenecer al partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF). Permite filtrar por categoría o solo mostrar recompensas disponibles.',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Categoría para filtrar las recompensas',
    example: 'Descuentos',
  })
  @ApiQuery({
    name: 'availableOnly',
    required: false,
    type: Boolean,
    description: 'Solo mostrar recompensas disponibles (activas y con stock)',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de recompensas obtenida exitosamente',
    type: GetRewardsResponse,
    example: {
      rewards: [
        {
          id: 1,
          tenantId: 1,
          name: 'Descuento del 20%',
          description: 'Obtén un descuento del 20% en tu próxima compra',
          image: 'https://example.com/reward-image.jpg',
          pointsRequired: 500,
          stock: 100,
          maxRedemptionsPerUser: 1,
          status: 'active',
          category: 'Descuentos',
          terms: 'Válido hasta fin de mes',
          validUntil: '2024-12-31T23:59:59Z',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
      ],
    },
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
  async getRewards(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @CurrentUser() user: JwtPayload,
    @Query('category') category?: string,
    @Query('availableOnly') availableOnly?: string,
  ): Promise<GetRewardsResponse> {
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
        throw new ForbiddenException('You can only access rewards from tenants of your partner');
      }
    }

    const request = new GetRewardsRequest();
    request.tenantId = tenantId;
    if (category) {
      request.category = category;
    }
    if (availableOnly === 'true') {
      request.availableOnly = true;
    }

    return this.getRewardsHandler.execute(request);
  }

  @Get('rewards/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener recompensa por ID',
    description:
      'Obtiene los detalles de una recompensa específica por su ID. La recompensa debe pertenecer a un tenant del partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la recompensa',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Recompensa encontrada exitosamente',
    type: GetRewardResponse,
    example: {
      id: 1,
      tenantId: 1,
      name: 'Descuento del 20%',
      description: 'Obtén un descuento del 20% en tu próxima compra',
      image: 'https://example.com/reward-image.jpg',
      pointsRequired: 500,
      stock: 100,
      maxRedemptionsPerUser: 1,
      status: 'active',
      category: 'Descuentos',
      terms: 'Válido hasta fin de mes',
      validUntil: '2024-12-31T23:59:59Z',
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o la recompensa no pertenece a un tenant de su partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Recompensa no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async getReward(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<GetRewardResponse> {
    // Validar que la recompensa existe y pertenece a un tenant del partner
    const reward = await this.rewardRepository.findById(id);
    if (!reward) {
      throw new NotFoundException(`Reward with ID ${id} not found`);
    }

    // Validar ownership del tenant
    const tenant = await this.tenantRepository.findById(reward.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${reward.tenantId} not found`);
    }

    // Para ADMIN/ADMIN_STAFF, permitir acceso a cualquier recurso
    const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('ADMIN_STAFF');
    if (!isAdmin) {
      const userEntity = await this.userRepository.findById(user.userId);
      if (!userEntity || !userEntity.partnerId) {
        throw new ForbiddenException('User does not belong to a partner');
      }

      if (tenant.partnerId !== userEntity.partnerId) {
        throw new ForbiddenException('You can only access rewards from tenants of your partner');
      }
    }

    const request = new GetRewardRequest();
    request.rewardId = id;

    return this.getRewardHandler.execute(request);
  }

  @Post('tenants/:tenantId/rewards')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nueva recompensa',
    description:
      'Crea una nueva recompensa asociada a un tenant específico. El tenant debe pertenecer al partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF).',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiBody({
    type: CreateRewardRequest,
    description: 'Datos de la recompensa a crear',
    examples: {
      ejemplo1: {
        summary: 'Recompensa básica',
        description: 'Ejemplo de creación de recompensa con datos mínimos',
        value: {
          name: 'Descuento del 20%',
          description: 'Obtén un descuento del 20% en tu próxima compra',
          pointsRequired: 500,
          stock: 100,
          category: 'Descuentos',
        },
      },
      ejemplo2: {
        summary: 'Recompensa completa',
        description: 'Ejemplo de creación de recompensa con todos los campos',
        value: {
          name: 'Descuento del 20%',
          description: 'Obtén un descuento del 20% en tu próxima compra',
          pointsRequired: 500,
          stock: 100,
          category: 'Descuentos',
          image: 'https://example.com/reward-image.jpg',
          maxRedemptionsPerUser: 1,
          terms: 'Válido hasta fin de mes. No acumulable con otras promociones.',
          validUntil: '2024-12-31T23:59:59Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Recompensa creada exitosamente',
    type: CreateRewardResponse,
    example: {
      id: 1,
      tenantId: 1,
      name: 'Descuento del 20%',
      description: 'Obtén un descuento del 20% en tu próxima compra',
      image: 'https://example.com/reward-image.jpg',
      pointsRequired: 500,
      stock: 100,
      maxRedemptionsPerUser: 1,
      status: 'active',
      category: 'Descuentos',
      terms: 'Válido hasta fin de mes',
      validUntil: '2024-12-31T23:59:59Z',
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: [
        'name should not be empty',
        'pointsRequired must be a positive number',
        'stock must be greater than or equal to -1',
      ],
      error: 'Bad Request',
    },
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
  async createReward(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body() request: CreateRewardRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<CreateRewardResponse> {
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
        throw new ForbiddenException('You can only create rewards for tenants from your partner');
      }
    }

    // Asignar tenantId al request (sobrescribir si viene en el body)
    request.tenantId = tenantId;

    return this.createRewardHandler.execute(request);
  }

  @Put('rewards/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar recompensa (PUT)',
    description:
      'Actualiza una recompensa existente. La recompensa debe pertenecer a un tenant del partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la recompensa',
    example: 1,
  })
  @ApiBody({
    type: UpdateRewardRequest,
    description: 'Datos de la recompensa a actualizar',
  })
  @ApiResponse({
    status: 200,
    description: 'Recompensa actualizada exitosamente',
    type: UpdateRewardResponse,
    example: {
      id: 1,
      tenantId: 1,
      name: 'Descuento del 25%',
      description: 'Obtén un descuento del 25% en tu próxima compra',
      image: 'https://example.com/reward-image-updated.jpg',
      pointsRequired: 600,
      stock: 50,
      maxRedemptionsPerUser: 2,
      status: 'active',
      category: 'Descuentos',
      terms: 'Válido hasta fin de año',
      validUntil: '2024-12-31T23:59:59Z',
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-20T14:45:00.000Z',
    },
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
    description: 'No tiene permisos o la recompensa no pertenece a un tenant de su partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Recompensa no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async updateRewardPut(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateRewardRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<UpdateRewardResponse> {
    return this.updateReward(id, request, user);
  }

  @Patch('rewards/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar recompensa (PATCH)',
    description:
      'Actualiza una recompensa existente (actualización parcial). La recompensa debe pertenecer a un tenant del partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la recompensa',
    example: 1,
  })
  @ApiBody({
    type: UpdateRewardRequest,
    description: 'Datos de la recompensa a actualizar (campos opcionales)',
  })
  @ApiResponse({
    status: 200,
    description: 'Recompensa actualizada exitosamente',
    type: UpdateRewardResponse,
    example: {
      id: 1,
      tenantId: 1,
      name: 'Descuento del 20%',
      description: 'Obtén un descuento del 20% en tu próxima compra',
      image: 'https://example.com/reward-image.jpg',
      pointsRequired: 500,
      stock: 75,
      maxRedemptionsPerUser: 1,
      status: 'active',
      category: 'Descuentos',
      terms: 'Válido hasta fin de mes',
      validUntil: '2024-12-31T23:59:59Z',
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-20T14:45:00.000Z',
    },
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
    description: 'No tiene permisos o la recompensa no pertenece a un tenant de su partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Recompensa no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async updateRewardPatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateRewardRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<UpdateRewardResponse> {
    return this.updateReward(id, request, user);
  }

  /**
   * Método privado compartido para actualizar recompensas (usado por PUT y PATCH)
   */
  private async updateReward(
    id: number,
    request: UpdateRewardRequest,
    user: JwtPayload,
  ): Promise<UpdateRewardResponse> {
    // Validar que la recompensa existe
    const reward = await this.rewardRepository.findById(id);
    if (!reward) {
      throw new NotFoundException(`Reward with ID ${id} not found`);
    }

    // Validar ownership del tenant
    const tenant = await this.tenantRepository.findById(reward.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${reward.tenantId} not found`);
    }

    // Para ADMIN/ADMIN_STAFF, permitir acceso a cualquier recurso
    const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('ADMIN_STAFF');
    if (!isAdmin) {
      const userEntity = await this.userRepository.findById(user.userId);
      if (!userEntity || !userEntity.partnerId) {
        throw new ForbiddenException('User does not belong to a partner');
      }

      if (tenant.partnerId !== userEntity.partnerId) {
        throw new ForbiddenException('You can only update rewards from tenants of your partner');
      }
    }

    return this.updateRewardHandler.execute(id, request);
  }

  @Delete('rewards/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar recompensa',
    description:
      'Elimina una recompensa existente. La recompensa debe pertenecer a un tenant del partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la recompensa',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Recompensa eliminada exitosamente',
    type: DeleteRewardResponse,
    example: {
      message: 'Reward deleted successfully',
      id: 1,
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o la recompensa no pertenece a un tenant de su partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Recompensa no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async deleteReward(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<DeleteRewardResponse> {
    // Validar que la recompensa existe
    const reward = await this.rewardRepository.findById(id);
    if (!reward) {
      throw new NotFoundException(`Reward with ID ${id} not found`);
    }

    // Validar ownership del tenant
    const tenant = await this.tenantRepository.findById(reward.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${reward.tenantId} not found`);
    }

    // Para ADMIN/ADMIN_STAFF, permitir acceso a cualquier recurso
    const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('ADMIN_STAFF');
    if (!isAdmin) {
      const userEntity = await this.userRepository.findById(user.userId);
      if (!userEntity || !userEntity.partnerId) {
        throw new ForbiddenException('User does not belong to a partner');
      }

      if (tenant.partnerId !== userEntity.partnerId) {
        throw new ForbiddenException('You can only delete rewards from tenants of your partner');
      }
    }

    const request = new DeleteRewardRequest();
    request.rewardId = id;

    return this.deleteRewardHandler.execute(request);
  }
}

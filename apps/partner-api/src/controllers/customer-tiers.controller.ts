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
  GetCustomerTiersHandler,
  GetCustomerTiersRequest,
  GetCustomerTiersResponse,
  GetCustomerTierHandler,
  GetCustomerTierRequest,
  GetCustomerTierResponse,
  CreateCustomerTierHandler,
  CreateCustomerTierRequest,
  CreateCustomerTierResponse,
  UpdateCustomerTierHandler,
  UpdateCustomerTierRequest,
  UpdateCustomerTierResponse,
  DeleteCustomerTierHandler,
  DeleteCustomerTierRequest,
  DeleteCustomerTierResponse,
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
import { IUserRepository, ITenantRepository, ICustomerTierRepository } from '@libs/domain';

/**
 * Controlador de Customer Tiers para Partner API
 * Permite gestionar los niveles/tiers de clientes de los tenants del partner autenticado
 *
 * Endpoints:
 * - GET /partner/tenants/:tenantId/customer-tiers - Listar customer tiers por tenant
 * - GET /partner/tenants/:tenantId/customer-tiers/:tierId - Obtener un customer tier específico
 * - POST /partner/tenants/:tenantId/customer-tiers - Crear un nuevo customer tier
 * - PATCH /partner/tenants/:tenantId/customer-tiers/:tierId - Actualizar un customer tier
 * - DELETE /partner/tenants/:tenantId/customer-tiers/:tierId - Eliminar un customer tier
 */
@ApiTags('Partner Customer Tiers')
@Controller('tenants/:tenantId/customer-tiers')
@UseGuards(JwtAuthGuard, RolesGuard, PartnerResourceGuard)
@Roles('PARTNER', 'PARTNER_STAFF', 'ADMIN', 'ADMIN_STAFF')
@ApiBearerAuth('JWT-auth')
export class CustomerTiersController {
  constructor(
    private readonly getCustomerTiersHandler: GetCustomerTiersHandler,
    private readonly getCustomerTierHandler: GetCustomerTierHandler,
    private readonly createCustomerTierHandler: CreateCustomerTierHandler,
    private readonly updateCustomerTierHandler: UpdateCustomerTierHandler,
    private readonly deleteCustomerTierHandler: DeleteCustomerTierHandler,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('ICustomerTierRepository')
    private readonly customerTierRepository: ICustomerTierRepository,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar customer tiers por tenant',
    description:
      'Obtiene la lista de todos los niveles/tiers de clientes asociados a un tenant específico. El tenant debe pertenecer al partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF).',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de customer tiers obtenida exitosamente',
    type: GetCustomerTiersResponse,
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
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getCustomerTiers(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<GetCustomerTiersResponse> {
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
          'You can only access customer tiers from tenants of your partner',
        );
      }
    }

    const request = new GetCustomerTiersRequest();
    request.tenantId = tenantId;

    return this.getCustomerTiersHandler.execute(request);
  }

  @Get(':tierId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener un customer tier específico',
    description:
      'Obtiene la información de un customer tier específico. El tier debe pertenecer al tenant especificado y el tenant debe pertenecer al partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF).',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiParam({
    name: 'tierId',
    type: Number,
    description: 'ID del customer tier',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Customer tier obtenido exitosamente',
    type: GetCustomerTierResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o el tier no pertenece al tenant especificado',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant o customer tier no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getCustomerTier(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('tierId', ParseIntPipe) tierId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<GetCustomerTierResponse> {
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
          'You can only access customer tiers from tenants of your partner',
        );
      }
    }

    // Validar que el tier existe y pertenece al tenant especificado
    const tier = await this.customerTierRepository.findById(tierId);
    if (!tier) {
      throw new NotFoundException(`Customer tier with ID ${tierId} not found`);
    }

    if (tier.tenantId !== tenantId) {
      throw new ForbiddenException(
        `Customer tier with ID ${tierId} does not belong to tenant with ID ${tenantId}`,
      );
    }

    const request = new GetCustomerTierRequest();
    request.customerTierId = tierId;

    return this.getCustomerTierHandler.execute(request);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo customer tier',
    description:
      'Crea un nuevo nivel/tier de cliente asociado a un tenant específico. El tenant debe pertenecer al partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF).',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiBody({
    type: CreateCustomerTierRequest,
    description: 'Datos del customer tier a crear',
    examples: {
      tierBasico: {
        summary: 'Tier básico',
        description: 'Ejemplo de creación de tier básico',
        value: {
          name: 'Bronce',
          description: 'Nivel inicial para nuevos clientes',
          minPoints: 0,
          maxPoints: 1000,
          color: '#cd7f32',
          benefits: ['Descuento del 5%', 'Envío gratis'],
          priority: 1,
          status: 'active',
        },
      },
      tierAvanzado: {
        summary: 'Tier avanzado',
        description: 'Ejemplo de creación de tier avanzado con multiplicador',
        value: {
          name: 'Oro',
          description: 'Nivel avanzado para clientes frecuentes',
          minPoints: 1000,
          maxPoints: 5000,
          color: '#ffd700',
          benefits: ['Descuento del 10%', 'Envío gratis', 'Acceso a productos exclusivos'],
          multiplier: 1.1,
          icon: 'star',
          priority: 2,
          status: 'active',
        },
      },
      tierMaximo: {
        summary: 'Tier máximo',
        description: 'Ejemplo de tier máximo sin límite superior',
        value: {
          name: 'Platino',
          description: 'Nivel máximo para clientes VIP',
          minPoints: 5000,
          maxPoints: null,
          color: '#e5e4e2',
          benefits: [
            'Descuento del 15%',
            'Envío gratis',
            'Acceso a productos exclusivos',
            'Atención prioritaria',
          ],
          multiplier: 1.15,
          icon: 'crown',
          priority: 3,
          status: 'active',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Customer tier creado exitosamente',
    type: CreateCustomerTierResponse,
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
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async createCustomerTier(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body() request: CreateCustomerTierRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<CreateCustomerTierResponse> {
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
          'You can only create customer tiers for tenants from your partner',
        );
      }
    }

    // Asignar tenantId al request (sobrescribir si viene en el body)
    request.tenantId = tenantId;

    return this.createCustomerTierHandler.execute(request);
  }

  @Patch(':tierId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar un customer tier',
    description:
      'Actualiza un customer tier existente (actualización parcial). El tier debe pertenecer al tenant especificado y el tenant debe pertenecer al partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF).',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiParam({
    name: 'tierId',
    type: Number,
    description: 'ID del customer tier',
    example: 1,
  })
  @ApiBody({
    type: UpdateCustomerTierRequest,
    description: 'Datos del customer tier a actualizar (campos opcionales)',
    examples: {
      actualizarNombre: {
        summary: 'Actualizar nombre',
        description: 'Ejemplo de actualización solo del nombre',
        value: {
          name: 'Bronce Premium',
        },
      },
      actualizarBeneficios: {
        summary: 'Actualizar beneficios',
        description: 'Ejemplo de actualización de beneficios',
        value: {
          benefits: ['Descuento del 7%', 'Envío gratis', 'Soporte prioritario'],
        },
      },
      actualizarMultiplicador: {
        summary: 'Actualizar multiplicador',
        description: 'Ejemplo de actualización del multiplicador de puntos',
        value: {
          multiplier: 1.12,
        },
      },
      desactivarTier: {
        summary: 'Desactivar tier',
        description: 'Ejemplo de desactivación de un tier',
        value: {
          status: 'inactive',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Customer tier actualizado exitosamente',
    type: UpdateCustomerTierResponse,
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
    description: 'No tiene permisos o el tier no pertenece al tenant especificado',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant o customer tier no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async updateCustomerTier(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('tierId', ParseIntPipe) tierId: number,
    @Body() request: UpdateCustomerTierRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<UpdateCustomerTierResponse> {
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
          'You can only update customer tiers from tenants of your partner',
        );
      }
    }

    // Validar que el tier existe y pertenece al tenant especificado
    const tier = await this.customerTierRepository.findById(tierId);
    if (!tier) {
      throw new NotFoundException(`Customer tier with ID ${tierId} not found`);
    }

    if (tier.tenantId !== tenantId) {
      throw new ForbiddenException(
        `Customer tier with ID ${tierId} does not belong to tenant with ID ${tenantId}`,
      );
    }

    return this.updateCustomerTierHandler.execute(tierId, request);
  }

  @Delete(':tierId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar un customer tier',
    description:
      'Elimina un customer tier existente. El tier debe pertenecer al tenant especificado y el tenant debe pertenecer al partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF).',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiParam({
    name: 'tierId',
    type: Number,
    description: 'ID del customer tier',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Customer tier eliminado exitosamente',
    type: DeleteCustomerTierResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o el tier no pertenece al tenant especificado',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant o customer tier no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async deleteCustomerTier(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('tierId', ParseIntPipe) tierId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<DeleteCustomerTierResponse> {
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
          'You can only delete customer tiers from tenants of your partner',
        );
      }
    }

    // Validar que el tier existe y pertenece al tenant especificado
    const tier = await this.customerTierRepository.findById(tierId);
    if (!tier) {
      throw new NotFoundException(`Customer tier with ID ${tierId} not found`);
    }

    if (tier.tenantId !== tenantId) {
      throw new ForbiddenException(
        `Customer tier with ID ${tierId} does not belong to tenant with ID ${tenantId}`,
      );
    }

    const request = new DeleteCustomerTierRequest();
    request.customerTierId = tierId;

    return this.deleteCustomerTierHandler.execute(request);
  }
}


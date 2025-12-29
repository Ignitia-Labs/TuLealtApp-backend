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
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  GetCustomerMembershipsHandler,
  GetCustomerMembershipsRequest,
  GetCustomerMembershipsResponse,
  GetCustomerMembershipHandler,
  GetCustomerMembershipRequest,
  GetCustomerMembershipResponse,
  CreateCustomerMembershipHandler,
  CreateCustomerMembershipRequest,
  CreateCustomerMembershipResponse,
  UpdateCustomerMembershipHandler,
  UpdateCustomerMembershipRequest,
  UpdateCustomerMembershipResponse,
  DeleteCustomerMembershipHandler,
  DeleteCustomerMembershipRequest,
  DeleteCustomerMembershipResponse,
} from '@libs/application';
import { ICustomerMembershipRepository } from '@libs/domain';
import {
  BadRequestErrorResponseDto,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  InternalServerErrorResponseDto,
  JwtAuthGuard,
  RolesGuard,
  Roles,
} from '@libs/shared';
import { Inject, NotFoundException } from '@nestjs/common';

/**
 * Controlador de customer memberships para Admin API
 * Permite gestionar memberships de customers en tenants
 *
 * Endpoints:
 * - GET /admin/customer-memberships?userId={id} - Listar memberships de un usuario
 * - GET /admin/customer-memberships?tenantId={id} - Listar todos los customers de un tenant
 * - POST /admin/customer-memberships - Crear nueva membership
 * - GET /admin/customer-memberships/:id - Obtener membership por ID
 * - GET /admin/customer-memberships/user/:userId/tenant/:tenantId - Obtener membership específica
 * - PATCH /admin/customer-memberships/:id - Actualizar membership
 * - DELETE /admin/customer-memberships/:id - Eliminar membership
 */
@ApiTags('Customer Memberships')
@Controller('admin/customer-memberships')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
@ApiBearerAuth('JWT-auth')
export class CustomerMembershipsController {
  constructor(
    private readonly getCustomerMembershipsHandler: GetCustomerMembershipsHandler,
    private readonly getCustomerMembershipHandler: GetCustomerMembershipHandler,
    private readonly createCustomerMembershipHandler: CreateCustomerMembershipHandler,
    private readonly updateCustomerMembershipHandler: UpdateCustomerMembershipHandler,
    private readonly deleteCustomerMembershipHandler: DeleteCustomerMembershipHandler,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar memberships',
    description:
      'Obtiene la lista de memberships. Puede filtrar por userId o tenantId mediante query parameters.',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description: 'ID del usuario para filtrar las memberships',
    example: 10,
  })
  @ApiQuery({
    name: 'tenantId',
    required: false,
    type: Number,
    description: 'ID del tenant para filtrar las memberships',
    example: 1,
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Si es true, solo retorna memberships activas',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de memberships obtenida exitosamente',
    type: GetCustomerMembershipsResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos suficientes (requiere ADMIN o STAFF)',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getCustomerMemberships(
    @Query('userId') userId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('activeOnly') activeOnly?: string,
  ): Promise<GetCustomerMembershipsResponse> {
    const request = new GetCustomerMembershipsRequest();
    if (userId) {
      request.userId = parseInt(userId, 10);
    }
    if (tenantId) {
      request.tenantId = parseInt(tenantId, 10);
    }
    if (activeOnly) {
      request.activeOnly = activeOnly === 'true';
    }
    return this.getCustomerMembershipsHandler.execute(request);
  }

  @Get('user/:userId/tenant/:tenantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener membership por usuario y tenant',
    description: 'Obtiene una membership específica por usuario y tenant',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID del usuario',
    type: Number,
    example: 10,
  })
  @ApiParam({
    name: 'tenantId',
    description: 'ID del tenant',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Membership encontrada',
    type: GetCustomerMembershipResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Membership no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async getCustomerMembershipByUserAndTenant(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('tenantId', ParseIntPipe) tenantId: number,
  ): Promise<GetCustomerMembershipResponse> {
    const membership = await this.membershipRepository.findByUserIdAndTenantId(userId, tenantId);
    if (!membership) {
      throw new NotFoundException(
        `Membership not found for user ${userId} and tenant ${tenantId}`,
      );
    }
    const request = new GetCustomerMembershipRequest();
    request.membershipId = membership.id;
    return this.getCustomerMembershipHandler.execute(request);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener membership por ID',
    description: 'Obtiene la información completa de una membership por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la membership',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Membership encontrada',
    type: GetCustomerMembershipResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Membership no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async getCustomerMembership(@Param('id', ParseIntPipe) id: number): Promise<GetCustomerMembershipResponse> {
    const request = new GetCustomerMembershipRequest();
    request.membershipId = id;
    return this.getCustomerMembershipHandler.execute(request);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nueva membership',
    description:
      'Crea una nueva membership para un usuario en un tenant. Genera automáticamente un QR code único y calcula el tier inicial basándose en los puntos.',
  })
  @ApiBody({
    type: CreateCustomerMembershipRequest,
    description: 'Datos de la membership a crear',
    examples: {
      ejemplo1: {
        summary: 'Membership básica',
        description: 'Ejemplo de creación de membership con datos mínimos',
        value: {
          userId: 10,
          tenantId: 1,
          registrationBranchId: 5,
          points: 0,
          status: 'active',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Membership creada exitosamente',
    type: CreateCustomerMembershipResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario, tenant o branch no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una membership para este usuario y tenant',
    example: {
      statusCode: 409,
      message: 'Membership already exists for user 10 and tenant 1',
      error: 'Conflict',
    },
  })
  async createCustomerMembership(
    @Body() request: CreateCustomerMembershipRequest,
  ): Promise<CreateCustomerMembershipResponse> {
    return this.createCustomerMembershipHandler.execute(request);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar membership',
    description:
      'Actualiza una membership existente. Todos los campos son opcionales, solo se actualizarán los campos enviados (actualización parcial PATCH).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la membership a actualizar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiBody({
    type: UpdateCustomerMembershipRequest,
    description: 'Datos de la membership a actualizar (todos los campos son opcionales)',
    examples: {
      ejemplo1: {
        summary: 'Actualizar puntos',
        description: 'Ejemplo de actualización de puntos (recalcula tier automáticamente)',
        value: {
          points: 2000,
        },
      },
      ejemplo2: {
        summary: 'Registrar visita',
        description: 'Ejemplo de registro de visita',
        value: {
          totalVisits: 15,
          lastVisit: '2024-01-20T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Membership actualizada exitosamente',
    type: UpdateCustomerMembershipResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Membership no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async updateCustomerMembership(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateCustomerMembershipRequest,
  ): Promise<UpdateCustomerMembershipResponse> {
    request.membershipId = id;
    return this.updateCustomerMembershipHandler.execute(request);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar membership',
    description: 'Elimina una membership del sistema.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la membership a eliminar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Membership eliminada exitosamente',
    type: DeleteCustomerMembershipResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Membership no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async deleteCustomerMembership(@Param('id', ParseIntPipe) id: number): Promise<DeleteCustomerMembershipResponse> {
    const request = new DeleteCustomerMembershipRequest();
    request.membershipId = id;
    return this.deleteCustomerMembershipHandler.execute(request);
  }
}


import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
  Inject,
  ForbiddenException,
  NotFoundException,
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
  CreatePartnerStaffUserHandler,
  CreatePartnerStaffUserRequest,
  CreatePartnerStaffUserResponse,
  GetPartnerUsersHandler,
  GetPartnerUsersRequest,
  GetPartnerUsersResponse,
  GetUserProfileHandler,
  GetUserProfileRequest,
  GetUserProfileResponse,
  UpdatePartnerUserAssignmentHandler,
  UpdatePartnerUserAssignmentRequest,
  UpdatePartnerUserAssignmentResponse,
  JwtPayload,
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
  CurrentUser,
  PartnerResourceGuard,
} from '@libs/shared';
import { IUserRepository } from '@libs/domain';

/**
 * Controlador de usuarios de partners para Partner API
 * Permite gestionar usuarios PARTNER y PARTNER_STAFF del partner autenticado
 *
 * Endpoints:
 * - POST /partner/partner-users/staff - Crear un usuario PARTNER_STAFF (solo PARTNER)
 * - GET /partner/partner-users - Obtener usuarios del partner (PARTNER y PARTNER_STAFF)
 * - GET /partner/partner-users/:userId - Obtener perfil de un usuario específico del partner
 * - PATCH /partner/partner-users/:userId/assignment - Asignar tenant y branch a usuario (solo PARTNER o ADMIN)
 */
@ApiTags('Partner Users')
@Controller('partner-users')
@UseGuards(JwtAuthGuard, RolesGuard, PartnerResourceGuard)
@Roles('PARTNER', 'PARTNER_STAFF')
@ApiBearerAuth('JWT-auth')
export class PartnerUsersController {
  constructor(
    private readonly createPartnerStaffUserHandler: CreatePartnerStaffUserHandler,
    private readonly getPartnerUsersHandler: GetPartnerUsersHandler,
    private readonly getUserProfileHandler: GetUserProfileHandler,
    private readonly updatePartnerUserAssignmentHandler: UpdatePartnerUserAssignmentHandler,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  @Post('staff')
  @HttpCode(HttpStatus.CREATED)
  @Roles('PARTNER') // Solo usuarios PARTNER pueden crear staff
  @ApiOperation({
    summary: 'Crear un usuario PARTNER_STAFF',
    description:
      'Crea un nuevo usuario con rol PARTNER_STAFF asociado al partner del usuario autenticado. Solo usuarios con rol PARTNER pueden crear staff. Opcionalmente se pueden asignar perfiles al crear el usuario.',
  })
  @ApiBody({
    type: CreatePartnerStaffUserRequest,
    description: 'Datos del usuario PARTNER_STAFF a crear. El partnerId se obtiene del usuario autenticado.',
    examples: {
      staffBasico: {
        summary: 'Staff básico',
        description: 'Ejemplo de creación de usuario PARTNER_STAFF sin perfiles',
        value: {
          email: 'staff@example.com',
          name: 'Jane Smith',
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '+502 2345-6789',
          password: 'SecurePass123!',
        },
      },
      staffConPerfiles: {
        summary: 'Staff con perfiles',
        description: 'Ejemplo de creación de usuario PARTNER_STAFF con perfiles asignados',
        value: {
          email: 'manager@example.com',
          name: 'Manager User',
          firstName: 'Manager',
          lastName: 'User',
          phone: '+502 3456-7890',
          password: 'SecurePass123!',
          profileIds: [5, 6],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario PARTNER_STAFF creado exitosamente',
    type: CreatePartnerStaffUserResponse,
    example: {
      id: 15,
      email: 'staff@example.com',
      name: 'Jane Smith',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+502 2345-6789',
      profile: null,
      roles: ['PARTNER_STAFF'],
      isActive: true,
      createdAt: '2024-01-15T10:30:00.000Z',
      partnerId: 1,
      assignedProfileIds: [5, 6],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o perfiles inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: [
        'email must be an email',
        'name should not be empty',
        'password must be longer than or equal to 6 characters',
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
    description: 'No tiene permisos de PARTNER o no pertenece a un partner',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Only users with PARTNER role can create staff users',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Partner o perfil no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'El email ya existe o el partner no está activo',
    example: {
      statusCode: 409,
      message: 'User with this email already exists',
      error: 'Conflict',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async createPartnerStaffUser(
    @Body() request: CreatePartnerStaffUserRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<CreatePartnerStaffUserResponse> {
    // Validar que el usuario autenticado tenga rol PARTNER
    if (!user.roles.includes('PARTNER')) {
      throw new ForbiddenException('Only users with PARTNER role can create staff users');
    }

    // Obtener partnerId del usuario autenticado
    const currentUserEntity = await this.userRepository.findById(user.userId);
    if (!currentUserEntity || !currentUserEntity.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    // Asignar el partnerId del usuario autenticado al request
    request.partnerId = currentUserEntity.partnerId;

    return this.createPartnerStaffUserHandler.execute(request);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener usuarios del partner',
    description:
      'Obtiene todos los usuarios (PARTNER y PARTNER_STAFF) asociados al partner del usuario autenticado. Por defecto incluye usuarios activos e inactivos. Soporta paginación.',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Número de registros a omitir (paginación)',
    example: 0,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Número de registros a tomar (paginación)',
    example: 50,
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Si se incluyen usuarios inactivos/bloqueados en la respuesta. Por defecto retorna todos los usuarios.',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Usuarios del partner obtenidos exitosamente',
    type: GetPartnerUsersResponse,
    example: {
      users: [
        {
          id: 10,
          email: 'partner@example.com',
          name: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+502 1234-5678',
          roles: ['PARTNER'],
          partnerId: 1,
          tenantId: 5,
          branchId: 10,
          isActive: true,
          createdAt: '2024-01-15T10:30:00.000Z',
        },
        {
          id: 15,
          email: 'staff@example.com',
          name: 'Jane Smith',
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '+502 2345-6789',
          roles: ['PARTNER_STAFF'],
          partnerId: 1,
          tenantId: 5,
          branchId: null,
          isActive: true,
          createdAt: '2024-01-20T14:45:00.000Z',
        },
        {
          id: 20,
          email: 'blocked@example.com',
          name: 'Blocked User',
          firstName: 'Blocked',
          lastName: 'User',
          phone: '+502 3456-7890',
          roles: ['PARTNER_STAFF'],
          partnerId: 1,
          tenantId: null,
          branchId: null,
          isActive: false,
          createdAt: '2024-01-10T08:00:00.000Z',
        },
      ],
      total: 3,
    },
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
    description: 'No tiene permisos de partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Partner no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getPartnerUsers(
    @CurrentUser() user: JwtPayload,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<GetPartnerUsersResponse> {
    // Obtener partnerId del usuario autenticado
    const currentUserEntity = await this.userRepository.findById(user.userId);
    if (!currentUserEntity || !currentUserEntity.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    const request = new GetPartnerUsersRequest();
    request.partnerId = currentUserEntity.partnerId;
    if (skip !== undefined) {
      request.skip = Number(skip);
    }
    if (take !== undefined) {
      request.take = Number(take);
    }
    if (includeInactive !== undefined) {
      request.includeInactive = includeInactive === 'true';
    }
    return this.getPartnerUsersHandler.execute(request);
  }

  @Get(':userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener perfil de un usuario del partner',
    description:
      'Obtiene el perfil completo de un usuario específico del partner. Solo puede ver usuarios que pertenezcan al mismo partner.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID único del usuario',
    type: Number,
    example: 15,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil de usuario obtenido exitosamente',
    type: GetUserProfileResponse,
    example: {
      id: 15,
      email: 'staff@example.com',
      name: 'Jane Smith',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+502 2345-6789',
      profile: null,
      roles: ['PARTNER_STAFF'],
      isActive: true,
      partnerId: 1,
      tenantId: 5,
      branchId: null,
      partner: {
        id: 1,
        name: 'Mi Empresa',
        domain: 'miempresa.gt',
        email: 'contacto@miempresa.gt',
        status: 'active',
      },
      tenant: {
        id: 5,
        name: 'Tienda Principal',
        partnerId: 1,
        status: 'active',
      },
      branch: null,
      createdAt: '2024-01-20T14:45:00.000Z',
      updatedAt: '2024-01-20T14:45:00.000Z',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o el usuario no pertenece a su partner',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'You can only view users from your partner',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'User with ID 15 not found',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getUserProfile(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<GetUserProfileResponse> {
    // Validar que el usuario objetivo pertenezca al mismo partner
    const targetUser = await this.userRepository.findById(userId);
    if (!targetUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const currentUserEntity = await this.userRepository.findById(user.userId);
    if (!currentUserEntity || !currentUserEntity.partnerId) {
      throw new ForbiddenException('Current user does not belong to a partner');
    }

    if (targetUser.partnerId !== currentUserEntity.partnerId) {
      throw new ForbiddenException('You can only view users from your partner');
    }

    const request = new GetUserProfileRequest();
    request.userId = userId;
    return this.getUserProfileHandler.execute(request);
  }

  @Patch(':userId/assignment')
  @HttpCode(HttpStatus.OK)
  @Roles('PARTNER', 'ADMIN') // Solo usuarios PARTNER o ADMIN pueden asignar tenant/branch
  @ApiOperation({
    summary: 'Asignar tenant y branch a usuario partner',
    description:
      'Asigna o actualiza el tenantId y branchId de un usuario PARTNER o PARTNER_STAFF. Solo usuarios con rol PARTNER o ADMIN pueden realizar esta operación. Los usuarios PARTNER solo pueden asignar usuarios de su mismo partner, mientras que los usuarios ADMIN pueden asignar usuarios de cualquier partner. El tenant debe pertenecer al mismo partner del usuario objetivo y el branch debe pertenecer al tenant asignado.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID del usuario partner a asignar',
    type: Number,
    example: 15,
    required: true,
  })
  @ApiBody({
    type: UpdatePartnerUserAssignmentRequest,
    description: 'Datos de asignación de tenant y branch',
    examples: {
      asignarTenant: {
        summary: 'Asignar solo tenant',
        description: 'Ejemplo de asignación de tenant sin branch',
        value: {
          tenantId: 5,
        },
      },
      asignarTenantYBranch: {
        summary: 'Asignar tenant y branch',
        description: 'Ejemplo de asignación de tenant y branch',
        value: {
          tenantId: 5,
          branchId: 10,
        },
      },
      actualizarBranch: {
        summary: 'Actualizar branch existente',
        description: 'Ejemplo de actualización de branch manteniendo el tenant',
        value: {
          branchId: 12,
        },
      },
      removerAsignacion: {
        summary: 'Remover asignación',
        description: 'Ejemplo de remoción de tenant y branch (asignar null)',
        value: {
          tenantId: null,
          branchId: null,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Asignación actualizada exitosamente',
    type: UpdatePartnerUserAssignmentResponse,
    example: {
      id: 15,
      email: 'staff@example.com',
      name: 'Jane Smith',
      partnerId: 1,
      tenantId: 5,
      branchId: 10,
      roles: ['PARTNER_STAFF'],
      updatedAt: '2024-01-20T14:45:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos, usuario no es PARTNER/PARTNER_STAFF, o validación de tenant/branch falló',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: 'Tenant with ID 5 does not belong to partner 1',
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
    description: 'No tiene permisos de PARTNER o el usuario no pertenece a su partner',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'You can only assign tenants and branches to users from your partner',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario, tenant o branch no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'User with ID 15 not found',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async updatePartnerUserAssignment(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: Partial<UpdatePartnerUserAssignmentRequest>,
    @CurrentUser() user: JwtPayload,
  ): Promise<UpdatePartnerUserAssignmentResponse> {
    // Validar que el usuario autenticado tenga rol PARTNER o ADMIN
    const hasPartnerOrAdminRole =
      user.roles.includes('PARTNER') || user.roles.includes('ADMIN');
    if (!hasPartnerOrAdminRole) {
      throw new ForbiddenException(
        'Only users with PARTNER or ADMIN role can assign tenants and branches',
      );
    }

    // Obtener usuario objetivo
    const targetUser = await this.userRepository.findById(userId);
    if (!targetUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Si el usuario autenticado es PARTNER (no ADMIN), validar que pertenezca al mismo partner
    if (user.roles.includes('PARTNER') && !user.roles.includes('ADMIN')) {
      const currentUserEntity = await this.userRepository.findById(user.userId);
      if (!currentUserEntity || !currentUserEntity.partnerId) {
        throw new ForbiddenException('Current user does not belong to a partner');
      }

      if (targetUser.partnerId !== currentUserEntity.partnerId) {
        throw new ForbiddenException(
          'You can only assign tenants and branches to users from your partner',
        );
      }
    }

    // Crear request con el userId del parámetro
    const request = new UpdatePartnerUserAssignmentRequest();
    request.userId = userId;
    request.tenantId = body.tenantId;
    request.branchId = body.branchId;

    return this.updatePartnerUserAssignmentHandler.execute(request);
  }
}


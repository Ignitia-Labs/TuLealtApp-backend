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
  CreatePartnerUserHandler,
  CreatePartnerUserRequest,
  CreatePartnerUserResponse,
  CreatePartnerStaffUserHandler,
  CreatePartnerStaffUserRequest,
  CreatePartnerStaffUserResponse,
  GetPartnerUsersHandler,
  GetPartnerUsersRequest,
  GetPartnerUsersResponse,
  UpdatePartnerUserPasswordHandler,
  UpdatePartnerUserPasswordRequest,
  UpdatePartnerUserPasswordResponse,
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
  PermissionsGuard,
  Permissions,
} from '@libs/shared';

/**
 * Controlador de usuarios de partners para Admin API
 * Permite gestionar usuarios PARTNER y PARTNER_STAFF
 *
 * Endpoints:
 * - POST /admin/partner-users - Crear un usuario PARTNER
 * - POST /admin/partner-users/staff - Crear un usuario PARTNER_STAFF
 * - GET /admin/partner-users/partner/:partnerId - Obtener usuarios de un partner
 * - PATCH /admin/partner-users/:userId/password - Actualizar contraseña de un usuario de partner
 */
@ApiTags('Partner Users')
@Controller('partner-users')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'STAFF')
@ApiBearerAuth('JWT-auth')
export class PartnerUsersController {
  constructor(
    private readonly createPartnerUserHandler: CreatePartnerUserHandler,
    private readonly createPartnerStaffUserHandler: CreatePartnerStaffUserHandler,
    private readonly getPartnerUsersHandler: GetPartnerUsersHandler,
    private readonly updatePartnerUserPasswordHandler: UpdatePartnerUserPasswordHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('admin.users.create')
  @ApiOperation({
    summary: 'Crear un usuario PARTNER',
    description:
      'Crea un nuevo usuario con rol PARTNER asociado a un partner específico. El usuario podrá acceder a la Partner API.',
  })
  @ApiBody({
    type: CreatePartnerUserRequest,
    description: 'Datos del usuario PARTNER a crear',
    examples: {
      usuarioBasico: {
        summary: 'Usuario básico',
        description: 'Ejemplo de creación de usuario PARTNER con datos mínimos',
        value: {
          email: 'partner@example.com',
          name: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+502 1234-5678',
          password: 'SecurePass123!',
          partnerId: 1,
        },
      },
      usuarioCompleto: {
        summary: 'Usuario completo',
        description: 'Ejemplo de creación de usuario PARTNER con perfil',
        value: {
          email: 'partner@example.com',
          name: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+502 1234-5678',
          password: 'SecurePass123!',
          partnerId: 1,
          profile: {
            preferences: {
              language: 'es',
              notifications: true,
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario PARTNER creado exitosamente',
    type: CreatePartnerUserResponse,
    example: {
      id: 10,
      email: 'partner@example.com',
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+502 1234-5678',
      profile: null,
      roles: ['PARTNER'],
      isActive: true,
      createdAt: '2024-01-15T10:30:00.000Z',
      partnerId: 1,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: [
        'email must be an email',
        'name should not be empty',
        'password must be longer than or equal to 6 characters',
        'partnerId must be a number',
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
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Partner no encontrado',
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
  async createPartnerUser(
    @Body() request: CreatePartnerUserRequest,
  ): Promise<CreatePartnerUserResponse> {
    return this.createPartnerUserHandler.execute(request);
  }

  @Post('staff')
  @HttpCode(HttpStatus.CREATED)
  @Permissions('admin.users.create')
  @ApiOperation({
    summary: 'Crear un usuario PARTNER_STAFF',
    description:
      'Crea un nuevo usuario con rol PARTNER_STAFF asociado a un partner específico. Opcionalmente se pueden asignar perfiles al crear el usuario.',
  })
  @ApiBody({
    type: CreatePartnerStaffUserRequest,
    description: 'Datos del usuario PARTNER_STAFF a crear',
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
          partnerId: 1,
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
          partnerId: 1,
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
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
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
  ): Promise<CreatePartnerStaffUserResponse> {
    return this.createPartnerStaffUserHandler.execute(request);
  }

  @Get('partner/:partnerId')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.users.view')
  @ApiOperation({
    summary: 'Obtener usuarios de un partner',
    description:
      'Obtiene todos los usuarios (PARTNER y PARTNER_STAFF) asociados a un partner específico. Por defecto incluye usuarios activos e inactivos. Soporta paginación.',
  })
  @ApiParam({
    name: 'partnerId',
    description: 'ID único del partner',
    type: Number,
    example: 1,
    required: true,
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
    description:
      'Si se incluyen usuarios inactivos/bloqueados en la respuesta. Por defecto retorna todos los usuarios.',
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
    description: 'No tiene permisos suficientes',
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
    @Param('partnerId', ParseIntPipe) partnerId: number,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<GetPartnerUsersResponse> {
    const request = new GetPartnerUsersRequest();
    request.partnerId = partnerId;
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

  @Patch(':userId/password')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.users.update')
  @ApiOperation({
    summary: 'Actualizar contraseña de un usuario de partner',
    description:
      'Permite a un administrador actualizar la contraseña de un usuario PARTNER o PARTNER_STAFF sin requerir la contraseña actual. Útil para resetear contraseñas olvidadas o asignar nuevas contraseñas.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID único del usuario cuya contraseña se actualizará',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiBody({
    type: UpdatePartnerUserPasswordRequest,
    description: 'Nueva contraseña para el usuario',
    examples: {
      example1: {
        summary: 'Actualizar contraseña',
        value: {
          newPassword: 'NewSecurePass123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada exitosamente',
    type: UpdatePartnerUserPasswordResponse,
    example: {
      message: 'Contraseña actualizada exitosamente',
      userId: 1,
      userEmail: 'partner@example.com',
      updatedAt: '2024-01-20T14:45:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o el usuario no es un usuario de partner',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: 'User with ID 1 is not a partner user (must have role PARTNER or PARTNER_STAFF)',
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
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'User with ID 1 not found',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async updatePartnerUserPassword(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: Omit<UpdatePartnerUserPasswordRequest, 'userId'>,
  ): Promise<UpdatePartnerUserPasswordResponse> {
    const request = new UpdatePartnerUserPasswordRequest();
    request.userId = userId;
    request.newPassword = body.newPassword;
    return this.updatePartnerUserPasswordHandler.execute(request);
  }
}

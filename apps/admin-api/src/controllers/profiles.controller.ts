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
  GetProfilesHandler,
  GetProfilesRequest,
  GetProfilesResponse,
  GetProfileHandler,
  GetProfileRequest,
  GetProfileResponse,
  CreateProfileHandler,
  CreateProfileRequest,
  CreateProfileResponse,
  UpdateProfileHandler,
  UpdateProfileRequest,
  UpdateProfileResponse,
  DeleteProfileHandler,
  DeleteProfileRequest,
  DeleteProfileResponse,
  GetProfileUsersHandler,
  GetProfileUsersRequest,
  GetProfileUsersResponse,
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
 * Controlador de perfiles para Admin API
 * Permite gestionar perfiles del sistema con permisos granulares
 *
 * Endpoints:
 * - GET /admin/profiles - Obtener perfiles (filtrado por partnerId opcional)
 * - POST /admin/profiles - Crear un nuevo perfil
 * - GET /admin/profiles/:id - Obtener perfil por ID
 * - PATCH /admin/profiles/:id - Actualizar perfil (actualización parcial)
 * - DELETE /admin/profiles/:id - Eliminar perfil
 * - GET /admin/profiles/:id/users - Obtener usuarios con un perfil específico
 */
@ApiTags('Profiles')
@Controller('profiles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'STAFF')
@ApiBearerAuth('JWT-auth')
export class ProfilesController {
  constructor(
    private readonly getProfilesHandler: GetProfilesHandler,
    private readonly getProfileHandler: GetProfileHandler,
    private readonly createProfileHandler: CreateProfileHandler,
    private readonly updateProfileHandler: UpdateProfileHandler,
    private readonly deleteProfileHandler: DeleteProfileHandler,
    private readonly getProfileUsersHandler: GetProfileUsersHandler,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.profiles.view')
  @ApiOperation({
    summary: 'Obtener perfiles',
    description:
      'Obtiene la lista de perfiles. Permite filtrar por partnerId (null = perfiles globales) y opcionalmente incluir perfiles inactivos.',
  })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    type: Number,
    description: 'ID del partner para filtrar (opcional, null = perfiles globales)',
    example: 1,
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Si se incluyen perfiles inactivos en la respuesta',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de perfiles obtenida exitosamente',
    type: GetProfilesResponse,
    example: {
      profiles: [
        {
          id: 1,
          name: 'Super Admin',
          description: 'Acceso completo al sistema. Puede gestionar todo, incluyendo configuración crítica.',
          partnerId: null,
          permissions: ['admin.*'],
          isActive: true,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
        {
          id: 2,
          name: 'Admin',
          description: 'Gestión completa del sistema excepto configuración crítica.',
          partnerId: null,
          permissions: ['admin.users.*', 'admin.partners.*', 'admin.profiles.*'],
          isActive: true,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
        {
          id: 5,
          name: 'Gerente de Tienda',
          description: 'Gestión de tiendas, productos, recompensas y reportes.',
          partnerId: 1,
          permissions: ['partner.branches.*', 'partner.products.*', 'partner.reports.view'],
          isActive: true,
          createdAt: '2024-01-20T14:45:00.000Z',
          updatedAt: '2024-01-20T14:45:00.000Z',
        },
      ],
      total: 3,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['partnerId must be a number', 'includeInactive must be a boolean value'],
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
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getProfiles(
    @Query('partnerId') partnerId?: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<GetProfilesResponse> {
    const request = new GetProfilesRequest();
    if (partnerId !== undefined) {
      request.partnerId = partnerId === 'null' ? null : Number(partnerId);
    }
    request.includeInactive = includeInactive === 'true';
    return this.getProfilesHandler.execute(request);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('admin.profiles.create')
  @ApiOperation({
    summary: 'Crear un nuevo perfil',
    description:
      'Crea un nuevo perfil con permisos granulares. El perfil puede ser global (partnerId = null) o específico de un partner.',
  })
  @ApiBody({
    type: CreateProfileRequest,
    description: 'Datos del perfil a crear',
    examples: {
      perfilGlobal: {
        summary: 'Perfil global',
        description: 'Ejemplo de creación de perfil global (sin partnerId)',
        value: {
          name: 'Super Admin',
          description: 'Acceso completo al sistema',
          permissions: ['admin.*'],
          isActive: true,
        },
      },
      perfilPartner: {
        summary: 'Perfil de partner',
        description: 'Ejemplo de creación de perfil específico de partner',
        value: {
          name: 'Gerente de Tienda',
          description: 'Puede gestionar productos y ver reportes',
          partnerId: 1,
          permissions: ['partner.products.*', 'partner.reports.view', 'partner.staff.manage'],
          isActive: true,
        },
      },
      perfilMinimo: {
        summary: 'Perfil mínimo',
        description: 'Ejemplo con datos mínimos requeridos',
        value: {
          name: 'Vendedor',
          permissions: ['partner.transactions.create', 'partner.transactions.view'],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Perfil creado exitosamente',
    type: CreateProfileResponse,
    example: {
      id: 1,
      name: 'Super Admin',
      description: 'Acceso completo al sistema',
      partnerId: null,
      permissions: ['admin.*'],
      isActive: true,
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
        'name must be longer than or equal to 2 characters',
        'permissions must be an array',
        'permissions should not be empty',
        "Invalid permission format: 'invalid.permission'. Permissions must follow the format 'module.resource.action' or 'module.*'",
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
    status: 409,
    description: 'El perfil ya existe (nombre duplicado para el mismo partnerId)',
    example: {
      statusCode: 409,
      message: "Profile with name 'Super Admin' already exists for global profiles",
      error: 'Conflict',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async createProfile(@Body() request: CreateProfileRequest): Promise<CreateProfileResponse> {
    return this.createProfileHandler.execute(request);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.profiles.view')
  @ApiOperation({
    summary: 'Obtener perfil por ID',
    description: 'Obtiene la información completa de un perfil por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del perfil',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil encontrado',
    type: GetProfileResponse,
    example: {
      id: 1,
      name: 'Super Admin',
      description: 'Acceso completo al sistema. Puede gestionar todo, incluyendo configuración crítica.',
      partnerId: null,
      permissions: ['admin.*'],
      isActive: true,
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
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getProfile(@Param('id', ParseIntPipe) id: number): Promise<GetProfileResponse> {
    const request = new GetProfileRequest();
    request.profileId = id;
    return this.getProfileHandler.execute(request);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.profiles.update')
  @ApiOperation({
    summary: 'Actualizar perfil',
    description:
      'Actualiza un perfil existente. Todos los campos son opcionales, solo se actualizarán los campos enviados (actualización parcial PATCH).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del perfil a actualizar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiBody({
    type: UpdateProfileRequest,
    description: 'Datos del perfil a actualizar (todos los campos son opcionales)',
    examples: {
      actualizarNombre: {
        summary: 'Actualizar solo nombre',
        description: 'Ejemplo de actualización parcial de solo el nombre',
        value: {
          name: 'Super Administrador',
        },
      },
      actualizarPermisos: {
        summary: 'Actualizar permisos',
        description: 'Ejemplo de actualización de permisos',
        value: {
          permissions: ['admin.users.*', 'admin.partners.*', 'admin.reports.*'],
        },
      },
      desactivarPerfil: {
        summary: 'Desactivar perfil',
        description: 'Ejemplo de desactivación de un perfil',
        value: {
          isActive: false,
        },
      },
      actualizacionCompleta: {
        summary: 'Actualización completa',
        description: 'Ejemplo de actualización de múltiples campos',
        value: {
          name: 'Admin Actualizado',
          description: 'Nueva descripción del perfil',
          permissions: ['admin.users.view', 'admin.users.create'],
          isActive: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado exitosamente',
    type: UpdateProfileResponse,
    example: {
      id: 1,
      name: 'Super Administrador',
      description: 'Acceso completo al sistema',
      partnerId: null,
      permissions: ['admin.*'],
      isActive: true,
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-20T14:45:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: [
        'name must be longer than or equal to 2 characters',
        'permissions must be an array',
        'permissions should not be empty',
        "Invalid permission format: 'invalid.permission'. Permissions must follow the format 'module.resource.action' or 'module.*'",
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
    description: 'Perfil no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateProfileRequest,
  ): Promise<UpdateProfileResponse> {
    return this.updateProfileHandler.execute(id, request);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.profiles.delete')
  @ApiOperation({
    summary: 'Eliminar perfil',
    description:
      'Elimina un perfil del sistema. Esta acción es irreversible. Se valida que no tenga asignaciones activas antes de eliminar.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del perfil a eliminar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil eliminado exitosamente',
    type: DeleteProfileResponse,
    example: {
      id: 1,
      message: 'Profile deleted successfully',
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
    description: 'Perfil no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'El perfil tiene asignaciones activas',
    example: {
      statusCode: 409,
      message: 'Profile has active user assignments',
      error: 'Conflict',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async deleteProfile(@Param('id', ParseIntPipe) id: number): Promise<DeleteProfileResponse> {
    const request = new DeleteProfileRequest();
    request.profileId = id;
    return this.deleteProfileHandler.execute(request);
  }

  @Get(':id/users')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.profiles.view')
  @ApiOperation({
    summary: 'Obtener usuarios con un perfil específico',
    description: 'Obtiene la lista de usuarios que tienen asignado un perfil específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del perfil',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Usuarios con el perfil obtenidos exitosamente',
    type: GetProfileUsersResponse,
    example: {
      users: [
        {
          id: 1,
          userId: 10,
          userEmail: 'user@example.com',
          userName: 'John Doe',
          assignedBy: 1,
          assignedAt: '2024-01-15T10:30:00.000Z',
          isActive: true,
        },
        {
          id: 2,
          userId: 11,
          userEmail: 'manager@example.com',
          userName: 'Jane Smith',
          assignedBy: 1,
          assignedAt: '2024-01-20T14:45:00.000Z',
          isActive: true,
        },
      ],
      total: 2,
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
    description: 'Perfil no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getProfileUsers(@Param('id', ParseIntPipe) id: number): Promise<GetProfileUsersResponse> {
    const request = new GetProfileUsersRequest();
    request.profileId = id;
    return this.getProfileUsersHandler.execute(request);
  }
}


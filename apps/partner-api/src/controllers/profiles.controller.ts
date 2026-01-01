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
  PermissionsGuard,
  Permissions,
  CurrentUser,
  PartnerResourceGuard,
} from '@libs/shared';
import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { IUserRepository } from '@libs/domain';

/**
 * Controlador de perfiles para Partner API
 * Permite gestionar perfiles del partner autenticado
 *
 * Endpoints:
 * - GET /partner/profiles - Obtener perfiles del partner
 * - POST /partner/profiles - Crear un nuevo perfil para el partner
 * - GET /partner/profiles/:id - Obtener perfil por ID
 * - PATCH /partner/profiles/:id - Actualizar perfil
 * - DELETE /partner/profiles/:id - Eliminar perfil
 */
@ApiTags('Partner Profiles')
@Controller('profiles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, PartnerResourceGuard)
@Roles('PARTNER', 'PARTNER_STAFF')
@ApiBearerAuth('JWT-auth')
@Injectable()
export class ProfilesController {
  constructor(
    private readonly getProfilesHandler: GetProfilesHandler,
    private readonly getProfileHandler: GetProfileHandler,
    private readonly createProfileHandler: CreateProfileHandler,
    private readonly updateProfileHandler: UpdateProfileHandler,
    private readonly deleteProfileHandler: DeleteProfileHandler,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions('partner.profiles.view')
  @ApiOperation({
    summary: 'Obtener perfiles del partner',
    description:
      'Obtiene la lista de perfiles del partner autenticado. Solo muestra perfiles que pertenecen al partner del usuario.',
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
          id: 5,
          name: 'Gerente de Tienda',
          description: 'Gestión de tiendas, productos, recompensas y reportes',
          partnerId: 1,
          permissions: ['partner.branches.*', 'partner.products.*', 'partner.reports.view'],
          isActive: true,
          createdAt: '2024-01-20T14:45:00.000Z',
          updatedAt: '2024-01-20T14:45:00.000Z',
        },
        {
          id: 6,
          name: 'Vendedor',
          description: 'Operaciones de venta y atención al cliente',
          partnerId: 1,
          permissions: ['partner.transactions.create', 'partner.transactions.view'],
          isActive: true,
          createdAt: '2024-01-20T14:45:00.000Z',
          updatedAt: '2024-01-20T14:45:00.000Z',
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
    status: 409,
    description: 'El perfil ya existe (nombre duplicado)',
    example: {
      statusCode: 409,
      message: "Profile with name 'Gerente de Tienda' already exists for partner 1",
      error: 'Conflict',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getProfiles(
    @CurrentUser() user: JwtPayload,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<GetProfilesResponse> {
    // Obtener partnerId del usuario autenticado
    const userEntity = await this.userRepository.findById(user.userId);
    if (!userEntity || !userEntity.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    const request = new GetProfilesRequest();
    request.partnerId = userEntity.partnerId; // Filtrar solo perfiles del partner
    request.includeInactive = includeInactive === 'true';
    return this.getProfilesHandler.execute(request);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('partner.profiles.create')
  @ApiOperation({
    summary: 'Crear un nuevo perfil para el partner',
    description:
      'Crea un nuevo perfil asociado al partner del usuario autenticado. El partnerId se asigna automáticamente.',
  })
  @ApiBody({
    type: CreateProfileRequest,
    description:
      'Datos del perfil a crear. El partnerId se asigna automáticamente del usuario autenticado.',
    examples: {
      perfilBasico: {
        summary: 'Perfil básico',
        description: 'Ejemplo de creación de perfil con datos mínimos',
        value: {
          name: 'Cajero',
          permissions: ['partner.transactions.create', 'partner.transactions.view'],
        },
      },
      perfilCompleto: {
        summary: 'Perfil completo',
        description: 'Ejemplo de creación de perfil con descripción',
        value: {
          name: 'Supervisor de Ventas',
          description: 'Puede gestionar ventas y ver reportes detallados',
          permissions: ['partner.transactions.*', 'partner.reports.view', 'partner.staff.view'],
          isActive: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Perfil creado exitosamente',
    type: CreateProfileResponse,
    example: {
      id: 7,
      name: 'Cajero',
      description: null,
      partnerId: 1,
      permissions: ['partner.transactions.create', 'partner.transactions.view'],
      isActive: true,
      createdAt: '2024-01-25T10:30:00.000Z',
      updatedAt: '2024-01-25T10:30:00.000Z',
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
    description: 'El perfil ya existe (nombre duplicado)',
    example: {
      statusCode: 409,
      message: "Profile with name 'Cajero' already exists for partner 1",
      error: 'Conflict',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async createProfile(
    @Body() request: CreateProfileRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<CreateProfileResponse> {
    // Obtener partnerId del usuario autenticado y asignarlo automáticamente
    const userEntity = await this.userRepository.findById(user.userId);
    if (!userEntity || !userEntity.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    // Asignar partnerId automáticamente (no permitir que el usuario lo especifique)
    request.partnerId = userEntity.partnerId;
    return this.createProfileHandler.execute(request);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('partner.profiles.view')
  @ApiOperation({
    summary: 'Obtener perfil por ID',
    description:
      'Obtiene la información completa de un perfil por su ID. Solo puede acceder a perfiles de su partner.',
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
      id: 5,
      name: 'Gerente de Tienda',
      description: 'Gestión de tiendas, productos, recompensas y reportes',
      partnerId: 1,
      permissions: ['partner.branches.*', 'partner.products.*', 'partner.reports.view'],
      isActive: true,
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
    description: 'No tiene permisos suficientes o el perfil no pertenece a su partner',
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
  @Permissions('partner.profiles.update')
  @ApiOperation({
    summary: 'Actualizar perfil',
    description:
      'Actualiza un perfil existente del partner. Todos los campos son opcionales, solo se actualizarán los campos enviados (actualización parcial PATCH).',
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
          name: 'Gerente General',
        },
      },
      actualizarPermisos: {
        summary: 'Actualizar permisos',
        description: 'Ejemplo de actualización de permisos',
        value: {
          permissions: ['partner.products.*', 'partner.reports.*', 'partner.staff.*'],
        },
      },
      desactivarPerfil: {
        summary: 'Desactivar perfil',
        description: 'Ejemplo de desactivación de un perfil',
        value: {
          isActive: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado exitosamente',
    type: UpdateProfileResponse,
    example: {
      id: 5,
      name: 'Gerente General',
      description: 'Gestión de tiendas, productos, recompensas y reportes',
      partnerId: 1,
      permissions: ['partner.products.*', 'partner.reports.*', 'partner.staff.*'],
      isActive: true,
      createdAt: '2024-01-20T14:45:00.000Z',
      updatedAt: '2024-01-25T16:30:00.000Z',
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
    description: 'No tiene permisos suficientes o el perfil no pertenece a su partner',
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
  @Permissions('partner.profiles.delete')
  @ApiOperation({
    summary: 'Eliminar perfil',
    description:
      'Elimina un perfil del partner. Esta acción es irreversible. Se valida que no tenga asignaciones activas antes de eliminar.',
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
      id: 5,
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
    description: 'No tiene permisos suficientes o el perfil no pertenece a su partner',
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
}

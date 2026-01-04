import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
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
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  AddPermissionToProfileHandler,
  AddPermissionToProfileRequest,
  AddPermissionToProfileResponse,
  RemovePermissionFromProfileHandler,
  RemovePermissionFromProfileRequest,
  RemovePermissionFromProfileResponse,
  GetProfilePermissionsHandler,
  GetProfilePermissionsRequest,
  GetProfilePermissionsResponse,
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
 * Controlador de relaciones perfil-permiso para Admin API
 * Permite gestionar qué permisos están asignados a qué perfiles
 *
 * Endpoints:
 * - POST /admin/profiles/:profileId/permissions - Agregar un permiso a un perfil
 * - DELETE /admin/profiles/:profileId/permissions/:permissionId - Remover un permiso de un perfil
 * - GET /admin/profiles/:profileId/permissions - Obtener permisos de un perfil
 */
@ApiTags('Profile Permissions')
@Controller('profiles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'STAFF')
@ApiBearerAuth('JWT-auth')
export class ProfilePermissionsController {
  constructor(
    private readonly addPermissionToProfileHandler: AddPermissionToProfileHandler,
    private readonly removePermissionFromProfileHandler: RemovePermissionFromProfileHandler,
    private readonly getProfilePermissionsHandler: GetProfilePermissionsHandler,
  ) {}

  @Post(':profileId/permissions')
  @HttpCode(HttpStatus.CREATED)
  @Permissions('admin.profiles.update')
  @ApiOperation({
    summary: 'Agregar un permiso a un perfil',
    description:
      'Agrega un permiso específico a un perfil. El permiso debe existir en el catálogo y estar activo. No se pueden agregar permisos duplicados.',
  })
  @ApiParam({
    name: 'profileId',
    description: 'ID único del perfil',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiBody({
    type: AddPermissionToProfileRequest,
    description: 'Datos del permiso a agregar al perfil',
    examples: {
      agregarPermiso: {
        summary: 'Agregar permiso a perfil',
        description: 'Ejemplo de agregar un permiso a un perfil',
        value: {
          permissionId: 5,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Permiso agregado al perfil exitosamente',
    type: AddPermissionToProfileResponse,
    example: {
      id: 1,
      profileId: 1,
      permissionId: 5,
      permissionCode: 'admin.users.create',
      createdAt: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['permissionId must be a number', 'permissionId should not be empty'],
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
    description: 'Perfil o permiso no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Profile with ID 1 not found',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 409,
    description: 'El perfil ya tiene el permiso asignado',
    example: {
      statusCode: 409,
      message: 'Profile 1 already has permission 5 assigned',
      error: 'Conflict',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async addPermissionToProfile(
    @Param('profileId', ParseIntPipe) profileId: number,
    @Body() request: AddPermissionToProfileRequest,
  ): Promise<AddPermissionToProfileResponse> {
    return this.addPermissionToProfileHandler.execute(profileId, request);
  }

  @Delete(':profileId/permissions/:permissionId')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.profiles.update')
  @ApiOperation({
    summary: 'Remover un permiso de un perfil',
    description:
      'Remueve un permiso específico de un perfil. Esta acción elimina la relación entre el perfil y el permiso.',
  })
  @ApiParam({
    name: 'profileId',
    description: 'ID único del perfil',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiParam({
    name: 'permissionId',
    description: 'ID único del permiso a remover',
    type: Number,
    example: 5,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Permiso removido del perfil exitosamente',
    type: RemovePermissionFromProfileResponse,
    example: {
      profileId: 1,
      permissionId: 5,
      message: 'Permission removed from profile successfully',
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
    description: 'Perfil, permiso o relación no encontrada',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Profile 1 does not have permission 5 assigned',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async removePermissionFromProfile(
    @Param('profileId', ParseIntPipe) profileId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ): Promise<RemovePermissionFromProfileResponse> {
    const request = new RemovePermissionFromProfileRequest();
    request.permissionId = permissionId;
    return this.removePermissionFromProfileHandler.execute(profileId, request);
  }

  @Get(':profileId/permissions')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.profiles.view')
  @ApiOperation({
    summary: 'Obtener permisos de un perfil',
    description:
      'Obtiene todos los permisos asignados a un perfil específico, incluyendo información detallada de cada permiso.',
  })
  @ApiParam({
    name: 'profileId',
    description: 'ID único del perfil',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Permisos del perfil obtenidos exitosamente',
    type: GetProfilePermissionsResponse,
    example: {
      profileId: 1,
      profileName: 'Super Admin',
      permissions: [
        {
          id: 1,
          permissionId: 5,
          permissionCode: 'admin.users.create',
          module: 'admin',
          resource: 'users',
          action: 'create',
          description: 'Permite crear usuarios',
          createdAt: '2024-01-15T10:30:00.000Z',
        },
        {
          id: 2,
          permissionId: 6,
          permissionCode: 'admin.users.view',
          module: 'admin',
          resource: 'users',
          action: 'view',
          description: 'Permite ver usuarios',
          createdAt: '2024-01-15T10:30:00.000Z',
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
    example: {
      statusCode: 404,
      message: 'Profile with ID 1 not found',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getProfilePermissions(
    @Param('profileId', ParseIntPipe) profileId: number,
  ): Promise<GetProfilePermissionsResponse> {
    const request = new GetProfilePermissionsRequest();
    request.profileId = profileId;
    return this.getProfilePermissionsHandler.execute(request);
  }

}


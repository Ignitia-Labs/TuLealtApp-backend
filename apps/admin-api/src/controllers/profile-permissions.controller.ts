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
  GetPermissionProfilesHandler,
  GetPermissionProfilesRequest,
  GetPermissionProfilesResponse,
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
 * Controlador de asignaciones de permisos a perfiles para Admin API
 * Permite gestionar qué permisos están asignados a qué perfiles
 *
 * Endpoints:
 * - POST /admin/profile-permissions/:profileId/permissions - Asignar un permiso a un perfil
 * - DELETE /admin/profile-permissions/:profileId/permissions/:permissionId - Remover permiso de un perfil
 * - GET /admin/profile-permissions/:profileId/permissions - Obtener permisos de un perfil
 * - GET /admin/profile-permissions/permission/:permissionId/profiles - Obtener perfiles con un permiso específico
 */
@ApiTags('Profile Permissions')
@Controller('profile-permissions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'STAFF')
@ApiBearerAuth('JWT-auth')
export class ProfilePermissionsController {
  constructor(
    private readonly addPermissionToProfileHandler: AddPermissionToProfileHandler,
    private readonly removePermissionFromProfileHandler: RemovePermissionFromProfileHandler,
    private readonly getProfilePermissionsHandler: GetProfilePermissionsHandler,
    private readonly getPermissionProfilesHandler: GetPermissionProfilesHandler,
  ) {}

  @Post(':profileId/permissions')
  @HttpCode(HttpStatus.CREATED)
  @Permissions('admin.profile-permissions.assign')
  @ApiOperation({
    summary: 'Asignar un permiso a un perfil',
    description:
      'Asigna un permiso a un perfil. Si el permiso ya está asignado, se lanza un error de conflicto.',
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
    description: 'Datos del permiso a asignar',
  })
  @ApiResponse({
    status: 201,
    description: 'Permiso asignado exitosamente',
    type: AddPermissionToProfileResponse,
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
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil o permiso no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'El perfil ya tiene el permiso asignado',
    type: InternalServerErrorResponseDto,
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
  @Permissions('admin.profile-permissions.remove')
  @ApiOperation({
    summary: 'Remover permiso de un perfil',
    description: 'Remueve un permiso de un perfil específico.',
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
    description: 'ID único del permiso',
    type: Number,
    example: 5,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Permiso removido exitosamente',
    type: RemovePermissionFromProfileResponse,
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
  @Permissions('admin.profile-permissions.view')
  @ApiOperation({
    summary: 'Obtener permisos de un perfil',
    description: 'Obtiene todos los permisos asignados a un perfil específico',
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
  async getProfilePermissions(
    @Param('profileId', ParseIntPipe) profileId: number,
  ): Promise<GetProfilePermissionsResponse> {
    const request = new GetProfilePermissionsRequest();
    request.profileId = profileId;
    return this.getProfilePermissionsHandler.execute(request);
  }

  @Get('permission/:permissionId/profiles')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.profile-permissions.view')
  @ApiOperation({
    summary: 'Obtener perfiles con un permiso específico',
    description: 'Obtiene todos los perfiles que tienen asignado un permiso específico',
  })
  @ApiParam({
    name: 'permissionId',
    description: 'ID único del permiso',
    type: Number,
    example: 5,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Perfiles con el permiso obtenidos exitosamente',
    type: GetPermissionProfilesResponse,
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
    description: 'Permiso no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getPermissionProfiles(
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ): Promise<GetPermissionProfilesResponse> {
    const request = new GetPermissionProfilesRequest();
    request.permissionId = permissionId;
    return this.getPermissionProfilesHandler.execute(request);
  }
}

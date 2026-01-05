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
  AssignPermissionToUserHandler,
  AssignPermissionToUserRequest,
  AssignPermissionToUserResponse,
  RemovePermissionFromUserHandler,
  RemovePermissionFromUserRequest,
  RemovePermissionFromUserResponse,
  GetUserPermissionsHandler,
  GetUserPermissionsRequest,
  GetUserPermissionsResponse,
  GetPermissionUsersHandler,
  GetPermissionUsersRequest,
  GetPermissionUsersResponse,
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
} from '@libs/shared';

/**
 * Controlador de asignaciones directas de permisos a usuarios para Admin API
 * Permite gestionar qué permisos están asignados directamente a qué usuarios
 *
 * Endpoints:
 * - POST /admin/user-permissions - Asignar un permiso directo a un usuario
 * - DELETE /admin/user-permissions/:id - Remover asignación de permiso directo a usuario
 * - GET /admin/user-permissions/user/:userId - Obtener permisos directos de un usuario
 * - GET /admin/user-permissions/permission/:permissionId - Obtener usuarios con un permiso específico
 */
@ApiTags('User Permissions')
@Controller('user-permissions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'STAFF')
@ApiBearerAuth('JWT-auth')
export class UserPermissionsController {
  constructor(
    private readonly assignPermissionToUserHandler: AssignPermissionToUserHandler,
    private readonly removePermissionFromUserHandler: RemovePermissionFromUserHandler,
    private readonly getUserPermissionsHandler: GetUserPermissionsHandler,
    private readonly getPermissionUsersHandler: GetPermissionUsersHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('admin.user-permissions.assign')
  @ApiOperation({
    summary: 'Asignar un permiso directo a un usuario',
    description:
      'Asigna un permiso directamente a un usuario (independiente de perfiles). Si el usuario ya tiene el permiso asignado pero inactivo, se reactiva.',
  })
  @ApiBody({
    type: AssignPermissionToUserRequest,
    description: 'Datos de la asignación de permiso directo a usuario',
  })
  @ApiResponse({
    status: 201,
    description: 'Permiso asignado exitosamente',
    type: AssignPermissionToUserResponse,
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
    description: 'Usuario o permiso no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'El usuario ya tiene el permiso asignado y activo',
    type: InternalServerErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async assignPermissionToUser(
    @Body() request: AssignPermissionToUserRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<AssignPermissionToUserResponse> {
    return this.assignPermissionToUserHandler.execute(request, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.user-permissions.remove')
  @ApiOperation({
    summary: 'Remover asignación de permiso directo a usuario',
    description:
      'Remueve una asignación de permiso directo a usuario (soft delete - desactiva la asignación).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la asignación a remover',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Asignación removida exitosamente',
    type: RemovePermissionFromUserResponse,
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
    description: 'Asignación no encontrada',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async removePermissionFromUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RemovePermissionFromUserResponse> {
    const request = new RemovePermissionFromUserRequest();
    request.userPermissionId = id;
    return this.removePermissionFromUserHandler.execute(request);
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.user-permissions.view')
  @ApiOperation({
    summary: 'Obtener permisos directos de un usuario',
    description: 'Obtiene todos los permisos asignados directamente a un usuario específico',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID único del usuario',
    type: Number,
    example: 10,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Permisos directos del usuario obtenidos exitosamente',
    type: GetUserPermissionsResponse,
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
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getUserPermissions(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<GetUserPermissionsResponse> {
    const request = new GetUserPermissionsRequest();
    request.userId = userId;
    return this.getUserPermissionsHandler.execute(request);
  }

  @Get('permission/:permissionId')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.user-permissions.view')
  @ApiOperation({
    summary: 'Obtener usuarios con un permiso específico',
    description:
      'Obtiene todos los usuarios que tienen asignado directamente un permiso específico',
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
    description: 'Usuarios con el permiso obtenidos exitosamente',
    type: GetPermissionUsersResponse,
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
  async getPermissionUsers(
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ): Promise<GetPermissionUsersResponse> {
    const request = new GetPermissionUsersRequest();
    request.permissionId = permissionId;
    return this.getPermissionUsersHandler.execute(request);
  }
}

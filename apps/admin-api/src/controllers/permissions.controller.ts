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
  CreatePermissionHandler,
  CreatePermissionRequest,
  CreatePermissionResponse,
  GetPermissionsHandler,
  GetPermissionsRequest,
  GetPermissionsResponse,
  GetPermissionHandler,
  GetPermissionRequest,
  GetPermissionResponse,
  UpdatePermissionHandler,
  UpdatePermissionRequest,
  UpdatePermissionResponse,
  DeletePermissionHandler,
  DeletePermissionRequest,
  DeletePermissionResponse,
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
 * Controlador de permisos para Admin API
 * Permite gestionar el catálogo centralizado de permisos
 *
 * Endpoints:
 * - GET /admin/permissions - Obtener permisos (con filtros opcionales)
 * - POST /admin/permissions - Crear un nuevo permiso
 * - GET /admin/permissions/:id - Obtener permiso por ID
 * - GET /admin/permissions/code/:code - Obtener permiso por código
 * - PATCH /admin/permissions/:id - Actualizar permiso (description, isActive)
 * - DELETE /admin/permissions/:id - Eliminar permiso
 */
@ApiTags('Permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'STAFF')
@ApiBearerAuth('JWT-auth')
export class PermissionsController {
  constructor(
    private readonly createPermissionHandler: CreatePermissionHandler,
    private readonly getPermissionsHandler: GetPermissionsHandler,
    private readonly getPermissionHandler: GetPermissionHandler,
    private readonly updatePermissionHandler: UpdatePermissionHandler,
    private readonly deletePermissionHandler: DeletePermissionHandler,
    private readonly getPermissionProfilesHandler: GetPermissionProfilesHandler,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.permissions.view')
  @ApiOperation({
    summary: 'Obtener permisos del catálogo',
    description:
      'Obtiene la lista de permisos del catálogo centralizado. Permite filtrar por módulo y recurso.',
  })
  @ApiQuery({
    name: 'module',
    required: false,
    type: String,
    description: 'Módulo para filtrar (ej: "admin", "partner")',
    example: 'admin',
  })
  @ApiQuery({
    name: 'resource',
    required: false,
    type: String,
    description: 'Recurso para filtrar (requiere module)',
    example: 'users',
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
    description: 'Número máximo de registros a retornar',
    example: 50,
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Si se incluyen permisos inactivos en la respuesta',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de permisos obtenida exitosamente',
    type: GetPermissionsResponse,
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
  async getPermissions(
    @Query('module') module?: string,
    @Query('resource') resource?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<GetPermissionsResponse> {
    const request = new GetPermissionsRequest();
    request.module = module;
    request.resource = resource;
    request.skip = skip ? parseInt(skip.toString(), 10) : undefined;
    request.take = take ? parseInt(take.toString(), 10) : undefined;
    request.includeInactive = includeInactive === 'true';
    return this.getPermissionsHandler.execute(request);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('admin.permissions.create')
  @ApiOperation({
    summary: 'Crear un nuevo permiso en el catálogo',
    description:
      'Crea un nuevo permiso en el catálogo centralizado. El código debe coincidir con module.resource.action o module.*',
  })
  @ApiBody({
    type: CreatePermissionRequest,
    description: 'Datos del permiso a crear',
  })
  @ApiResponse({
    status: 201,
    description: 'Permiso creado exitosamente',
    type: CreatePermissionResponse,
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
    status: 409,
    description: 'El permiso ya existe',
    type: InternalServerErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async createPermission(
    @Body() request: CreatePermissionRequest,
  ): Promise<CreatePermissionResponse> {
    return this.createPermissionHandler.execute(request);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.permissions.view')
  @ApiOperation({
    summary: 'Obtener permiso por ID',
    description: 'Obtiene la información completa de un permiso por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del permiso',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Permiso encontrado',
    type: GetPermissionResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Permiso no encontrado',
    type: NotFoundErrorResponseDto,
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
  async getPermission(@Param('id', ParseIntPipe) id: number): Promise<GetPermissionResponse> {
    const request = new GetPermissionRequest();
    request.permissionId = id;
    return this.getPermissionHandler.execute(request);
  }

  @Get('code/:code')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.permissions.view')
  @ApiOperation({
    summary: 'Obtener permiso por código',
    description: 'Obtiene la información completa de un permiso por su código único',
  })
  @ApiParam({
    name: 'code',
    description: 'Código único del permiso (ej: "admin.users.create")',
    type: String,
    example: 'admin.users.create',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Permiso encontrado',
    type: GetPermissionResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Permiso no encontrado',
    type: NotFoundErrorResponseDto,
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
  async getPermissionByCode(@Param('code') code: string): Promise<GetPermissionResponse> {
    const request = new GetPermissionRequest();
    request.code = code;
    return this.getPermissionHandler.execute(request);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.permissions.update')
  @ApiOperation({
    summary: 'Actualizar permiso',
    description:
      'Actualiza un permiso existente. Solo se pueden actualizar description e isActive. code, module, resource y action NO se pueden cambiar.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del permiso a actualizar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiBody({
    type: UpdatePermissionRequest,
    description: 'Datos del permiso a actualizar (todos los campos son opcionales)',
  })
  @ApiResponse({
    status: 200,
    description: 'Permiso actualizado exitosamente',
    type: UpdatePermissionResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Permiso no encontrado',
    type: NotFoundErrorResponseDto,
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
  async updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdatePermissionRequest,
  ): Promise<UpdatePermissionResponse> {
    return this.updatePermissionHandler.execute(id, request);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.permissions.delete')
  @ApiOperation({
    summary: 'Eliminar permiso',
    description:
      'Elimina un permiso del catálogo. Valida que no esté en uso (asignaciones directas o perfiles activos) antes de eliminar.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del permiso a eliminar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Permiso eliminado exitosamente',
    type: DeletePermissionResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Permiso no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'El permiso está en uso y no se puede eliminar',
    type: InternalServerErrorResponseDto,
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
  async deletePermission(@Param('id', ParseIntPipe) id: number): Promise<DeletePermissionResponse> {
    const request = new DeletePermissionRequest();
    request.permissionId = id;
    return this.deletePermissionHandler.execute(request);
  }

  @Get(':id/profiles')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.permissions.view')
  @ApiOperation({
    summary: 'Obtener perfiles que tienen un permiso específico',
    description:
      'Obtiene todos los perfiles que tienen asignado un permiso específico, incluyendo información detallada de cada perfil.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del permiso',
    type: Number,
    example: 5,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Perfiles con el permiso obtenidos exitosamente',
    type: GetPermissionProfilesResponse,
    example: {
      permissionId: 5,
      permissionCode: 'admin.users.create',
      profiles: [
        {
          id: 1,
          profileId: 1,
          profileName: 'Super Admin',
          profileDescription: 'Acceso completo al sistema',
          partnerId: null,
          isActive: true,
          createdAt: '2024-01-15T10:30:00.000Z',
        },
        {
          id: 2,
          profileId: 2,
          profileName: 'Admin',
          profileDescription: 'Gestión completa del sistema',
          partnerId: null,
          isActive: true,
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
    description: 'Permiso no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Permission with ID 5 not found',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getPermissionProfiles(
    @Param('id', ParseIntPipe) permissionId: number,
  ): Promise<GetPermissionProfilesResponse> {
    const request = new GetPermissionProfilesRequest();
    request.permissionId = permissionId;
    return this.getPermissionProfilesHandler.execute(request);
  }
}

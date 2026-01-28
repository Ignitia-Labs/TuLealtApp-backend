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
  CreateUserHandler,
  CreateUserRequest,
  CreateUserResponse,
  GetUserProfileHandler,
  GetUserProfileRequest,
  GetUserProfileResponse,
  LockUserHandler,
  LockUserRequest,
  LockUserResponse,
  UnlockUserHandler,
  UnlockUserRequest,
  UnlockUserResponse,
  DeleteUserHandler,
  DeleteUserRequest,
  DeleteUserResponse,
  GetUserChangeHistoryHandler,
  GetUserChangeHistoryRequest,
  GetUserChangeHistoryResponse,
  UpdateUserProfileHandler,
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
  GetAdminStaffUsersHandler,
  GetAdminStaffUsersRequest,
  GetAdminStaffUsersResponse,
  UpdatePartnerUserAssignmentHandler,
  UpdatePartnerUserAssignmentRequest,
  UpdatePartnerUserAssignmentResponse,
} from '@libs/application';
import {
  JwtAuthGuard,
  BadRequestErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  NotFoundErrorResponseDto,
  InternalServerErrorResponseDto,
  CurrentUser,
} from '@libs/shared';
import { JwtPayload } from '@libs/application';

/**
 * Controlador de usuarios para Admin API
 * Capa delgada que solo delega a los handlers de aplicación
 */
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserHandler: CreateUserHandler,
    private readonly getUserProfileHandler: GetUserProfileHandler,
    private readonly lockUserHandler: LockUserHandler,
    private readonly unlockUserHandler: UnlockUserHandler,
    private readonly deleteUserHandler: DeleteUserHandler,
    private readonly getUserChangeHistoryHandler: GetUserChangeHistoryHandler,
    private readonly updateUserProfileHandler: UpdateUserProfileHandler,
    private readonly getAdminStaffUsersHandler: GetAdminStaffUsersHandler,
    private readonly updatePartnerUserAssignmentHandler: UpdatePartnerUserAssignmentHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear un nuevo usuario',
    description: 'Crea un nuevo usuario en el sistema. Requiere permisos de administrador.',
  })
  @ApiBody({
    type: CreateUserRequest,
    description: 'Datos del usuario a crear',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente',
    type: CreateUserResponse,
    example: {
      id: 1,
      email: 'user@example.com',
      name: 'Jane Smith',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1234567890',
      profile: { preferences: { language: 'es', notifications: true } },
      roles: ['CUSTOMER'],
      isActive: true,
      createdAt: '2024-01-15T10:30:00.000Z',
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
      ],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos de administrador',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 409,
    description: 'El usuario ya existe',
    example: {
      statusCode: 409,
      message: 'El email ya está registrado',
      error: 'Conflict',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
    example: {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    },
  })
  async createUser(@Body() request: CreateUserRequest): Promise<CreateUserResponse> {
    return this.createUserHandler.execute(request);
  }

  @Get('admin-staff')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener usuarios con roles ADMIN o STAFF',
    description:
      'Retorna una lista de usuarios que tienen al menos uno de los roles ADMIN o STAFF. Útil para asignar usuarios a solicitudes de partners.',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Número de registros a omitir (para paginación)',
    example: 0,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Número máximo de registros a retornar',
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente',
    type: GetAdminStaffUsersResponse,
    example: {
      users: [
        {
          id: 1,
          email: 'admin@example.com',
          name: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+502 1234-5678',
          roles: ['ADMIN'],
          isActive: true,
          createdAt: '2024-01-15T10:30:00.000Z',
        },
        {
          id: 2,
          email: 'staff@example.com',
          name: 'Jane Smith',
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '+502 9876-5432',
          roles: ['STAFF'],
          isActive: true,
          createdAt: '2024-01-16T11:00:00.000Z',
        },
      ],
      total: 2,
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos suficientes',
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['skip must be a positive number', 'take must be a positive number'],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
    example: {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    },
  })
  async getAdminStaffUsers(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ): Promise<GetAdminStaffUsersResponse> {
    const request = new GetAdminStaffUsersRequest();
    request.skip = skip ? parseInt(skip.toString(), 10) : undefined;
    request.take = take ? parseInt(take.toString(), 10) : undefined;
    return this.getAdminStaffUsersHandler.execute(request);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener perfil de usuario por ID',
    description: 'Obtiene los detalles completos del perfil de un usuario específico por su ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del usuario',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil de usuario encontrado',
    type: GetUserProfileResponse,
    example: {
      id: 1,
      email: 'user@example.com',
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      profile: { preferences: { language: 'es', theme: 'light' } },
      roles: ['CUSTOMER'],
      isActive: true,
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-20T14:45:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'ID de usuario inválido',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['id must be a positive number'],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Usuario no encontrado',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
    example: {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    },
  })
  async getUserProfile(@Param('id', ParseIntPipe) id: number): Promise<GetUserProfileResponse> {
    const request = new GetUserProfileRequest();
    request.userId = id;
    return this.getUserProfileHandler.execute(request);
  }

  @Patch(':id/lock')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Bloquear un usuario',
    description:
      'Bloquea un usuario del sistema, desactivando su cuenta. Requiere permisos de administrador.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario a bloquear',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario bloqueado exitosamente',
    type: LockUserResponse,
    example: {
      id: 1,
      isActive: false,
      updatedAt: '2024-01-20T14:45:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'ID de usuario inválido',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['id must be a positive number'],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Usuario no encontrado',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
    example: {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    },
  })
  async lockUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<LockUserResponse> {
    const request = new LockUserRequest();
    request.userId = id;
    return this.lockUserHandler.execute(request, user.userId);
  }

  @Patch(':id/unlock')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Desbloquear un usuario',
    description:
      'Desbloquea un usuario del sistema, reactivando su cuenta. Requiere permisos de administrador.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario a desbloquear',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario desbloqueado exitosamente',
    type: UnlockUserResponse,
    example: {
      id: 1,
      isActive: true,
      updatedAt: '2024-01-20T14:45:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'ID de usuario inválido',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async unlockUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<UnlockUserResponse> {
    const request = new UnlockUserRequest();
    request.userId = id;
    return this.unlockUserHandler.execute(request, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Eliminar un usuario',
    description:
      'Elimina un usuario del sistema (soft delete - marca como inactivo). Esta acción es irreversible. Requiere permisos de administrador.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario a eliminar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario eliminado exitosamente',
    type: DeleteUserResponse,
    example: {
      id: 1,
      message: 'User deleted successfully',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'ID de usuario inválido',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'El usuario ya está eliminado',
    example: {
      statusCode: 409,
      message: 'User with ID 1 is already deleted',
      error: 'Conflict',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<DeleteUserResponse> {
    const request = new DeleteUserRequest();
    request.userId = id;
    return this.deleteUserHandler.execute(request, user.userId);
  }

  @Get(':id/history')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener historial de cambios de un usuario',
    description:
      'Obtiene el historial completo de cambios realizados en un usuario específico. Incluye creación, actualizaciones, bloqueos, desbloqueos y eliminaciones.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario del cual obtener el historial',
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
  @ApiResponse({
    status: 200,
    description: 'Historial de cambios obtenido exitosamente',
    type: GetUserChangeHistoryResponse,
    example: {
      history: [
        {
          id: 1,
          userId: 1,
          changedBy: 2,
          action: 'updated',
          field: 'email',
          oldValue: 'old@example.com',
          newValue: 'new@example.com',
          metadata: null,
          createdAt: '2024-01-20T14:45:00.000Z',
        },
        {
          id: 2,
          userId: 1,
          changedBy: 2,
          action: 'locked',
          field: 'isActive',
          oldValue: 'true',
          newValue: 'false',
          metadata: null,
          createdAt: '2024-01-19T10:30:00.000Z',
        },
      ],
      total: 2,
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getUserChangeHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ): Promise<GetUserChangeHistoryResponse> {
    const request = new GetUserChangeHistoryRequest();
    request.userId = id;
    if (skip !== undefined) {
      request.skip = Number(skip);
    }
    if (take !== undefined) {
      request.take = Number(take);
    }
    return this.getUserChangeHistoryHandler.execute(request);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar perfil de usuario',
    description:
      'Actualiza el perfil de un usuario existente (actualización parcial). Requiere permisos de administrador.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario a actualizar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiBody({
    type: UpdateUserProfileRequest,
    description: 'Datos a actualizar',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil de usuario actualizado exitosamente',
    type: UpdateUserProfileResponse,
    example: {
      id: 1,
      email: 'updated@example.com',
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+9876543210',
      profile: { preferences: { language: 'en', theme: 'dark' } },
      roles: ['CUSTOMER'],
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
      message: ['email must be an email', 'firstName should not be empty'],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Usuario no encontrado',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 409,
    description: 'El email ya está en uso',
    example: {
      statusCode: 409,
      message: 'El email ya está registrado',
      error: 'Conflict',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
    example: {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    },
  })
  async updateUserProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<UpdateUserProfileRequest>,
  ): Promise<UpdateUserProfileResponse> {
    const request = new UpdateUserProfileRequest();
    request.userId = id;
    request.email = body.email;
    request.firstName = body.firstName;
    request.lastName = body.lastName;
    request.phone = body.phone;
    request.profile = body.profile;
    return this.updateUserProfileHandler.execute(request);
  }

  @Patch(':id/partner-assignment')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar asignación de tenant y branch a usuario partner',
    description:
      'Asigna o actualiza el tenantId y branchId de un usuario PARTNER o PARTNER_STAFF. Solo usuarios con estos roles pueden tener tenant y branch asignados.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario partner',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiBody({
    type: UpdatePartnerUserAssignmentRequest,
    description: 'Datos de asignación de tenant y branch',
    examples: {
      asignarTenant: {
        summary: 'Asignar tenant',
        value: {
          tenantId: 5,
        },
      },
      asignarTenantYBranch: {
        summary: 'Asignar tenant y branch',
        value: {
          tenantId: 5,
          branchId: 10,
        },
      },
      removerAsignacion: {
        summary: 'Remover asignación',
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
      id: 1,
      email: 'partner@example.com',
      name: 'Partner User',
      partnerId: 1,
      tenantId: 5,
      branchId: 10,
      roles: ['PARTNER'],
      updatedAt: '2024-01-20T14:45:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o usuario no es PARTNER/PARTNER_STAFF',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: 'User with ID 1 must have role PARTNER or PARTNER_STAFF',
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario, tenant o branch no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async updatePartnerUserAssignment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<UpdatePartnerUserAssignmentRequest>,
  ): Promise<UpdatePartnerUserAssignmentResponse> {
    const request = new UpdatePartnerUserAssignmentRequest();
    request.userId = id;
    request.tenantId = body.tenantId;
    request.branchId = body.branchId;
    return this.updatePartnerUserAssignmentHandler.execute(request);
  }
}

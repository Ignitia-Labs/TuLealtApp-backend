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
  AssignProfileToUserHandler,
  AssignProfileToUserRequest,
  AssignProfileToUserResponse,
  RemoveProfileFromUserHandler,
  RemoveProfileFromUserRequest,
  RemoveProfileFromUserResponse,
  GetUserProfilesHandler,
  GetUserProfilesRequest,
  GetUserProfilesResponse,
  GetProfileUsersHandler,
  GetProfileUsersRequest,
  GetProfileUsersResponse,
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
 * Controlador de asignaciones de perfiles a usuarios para Admin API
 * Permite gestionar qué perfiles están asignados a qué usuarios
 *
 * Endpoints:
 * - POST /admin/user-profiles - Asignar un perfil a un usuario
 * - DELETE /admin/user-profiles/:id - Remover asignación de perfil a usuario
 * - GET /admin/user-profiles/user/:userId - Obtener perfiles de un usuario
 * - GET /admin/user-profiles/profile/:profileId - Obtener usuarios con un perfil específico
 */
@ApiTags('User Profiles')
@Controller('user-profiles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'STAFF')
@ApiBearerAuth('JWT-auth')
export class UserProfilesController {
  constructor(
    private readonly assignProfileToUserHandler: AssignProfileToUserHandler,
    private readonly removeProfileFromUserHandler: RemoveProfileFromUserHandler,
    private readonly getUserProfilesHandler: GetUserProfilesHandler,
    private readonly getProfileUsersHandler: GetProfileUsersHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('admin.user-profiles.assign')
  @ApiOperation({
    summary: 'Asignar un perfil a un usuario',
    description:
      'Asigna un perfil a un usuario. Si el usuario ya tiene el perfil asignado pero inactivo, se reactiva.',
  })
  @ApiBody({
    type: AssignProfileToUserRequest,
    description: 'Datos de la asignación de perfil a usuario',
    examples: {
      asignacionBasica: {
        summary: 'Asignación básica',
        description: 'Ejemplo de asignación de perfil a usuario',
        value: {
          userId: 10,
          profileId: 5,
          assignedBy: 1,
        },
      },
      asignacionStaff: {
        summary: 'Asignar perfil a staff',
        description: 'Ejemplo de asignación de perfil a usuario PARTNER_STAFF',
        value: {
          userId: 15,
          profileId: 6,
          assignedBy: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Perfil asignado exitosamente',
    type: AssignProfileToUserResponse,
    example: {
      id: 1,
      userId: 10,
      profileId: 5,
      assignedBy: 1,
      assignedAt: '2024-01-15T10:30:00.000Z',
      isActive: true,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['userId must be a number', 'profileId must be a number', 'assignedBy must be a number'],
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
    description: 'Usuario o perfil no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'El usuario ya tiene el perfil asignado y activo',
    example: {
      statusCode: 409,
      message: 'User already has profile assigned and active',
      error: 'Conflict',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async assignProfileToUser(
    @Body() request: AssignProfileToUserRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<AssignProfileToUserResponse> {
    // Asignar el userId del JWT al campo assignedBy
    request.assignedBy = user.userId;
    return this.assignProfileToUserHandler.execute(request);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.user-profiles.remove')
  @ApiOperation({
    summary: 'Remover asignación de perfil a usuario',
    description:
      'Remueve una asignación de perfil a usuario (soft delete - desactiva la asignación).',
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
    type: RemoveProfileFromUserResponse,
    example: {
      id: 1,
      message: 'Profile assignment removed successfully',
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
    description: 'Asignación no encontrada',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async removeProfileFromUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RemoveProfileFromUserResponse> {
    const request = new RemoveProfileFromUserRequest();
    request.userProfileId = id;
    return this.removeProfileFromUserHandler.execute(request);
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.user-profiles.view')
  @ApiOperation({
    summary: 'Obtener perfiles de un usuario',
    description: 'Obtiene todos los perfiles asignados a un usuario específico',
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
    description: 'Perfiles del usuario obtenidos exitosamente',
    type: GetUserProfilesResponse,
    example: {
      profiles: [
        {
          id: 1,
          profileId: 5,
          profileName: 'Gerente de Tienda',
          profileDescription: 'Puede gestionar productos y ver reportes',
          permissions: ['partner.products.*', 'partner.reports.view', 'partner.staff.manage'],
          assignedBy: 1,
          assignedAt: '2024-01-15T10:30:00.000Z',
          isActive: true,
        },
        {
          id: 2,
          profileId: 6,
          profileName: 'Vendedor',
          profileDescription: 'Operaciones de venta y atención al cliente',
          permissions: ['partner.transactions.create', 'partner.transactions.view'],
          assignedBy: 1,
          assignedAt: '2024-01-20T14:45:00.000Z',
          isActive: false,
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
    description: 'Usuario no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getUserProfiles(@Param('userId', ParseIntPipe) userId: number): Promise<GetUserProfilesResponse> {
    const request = new GetUserProfilesRequest();
    request.userId = userId;
    return this.getUserProfilesHandler.execute(request);
  }

  @Get('profile/:profileId')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.user-profiles.view')
  @ApiOperation({
    summary: 'Obtener usuarios con un perfil específico',
    description: 'Obtiene todos los usuarios que tienen asignado un perfil específico',
  })
  @ApiParam({
    name: 'profileId',
    description: 'ID único del perfil',
    type: Number,
    example: 5,
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
  async getProfileUsers(
    @Param('profileId', ParseIntPipe) profileId: number,
  ): Promise<GetProfileUsersResponse> {
    const request = new GetProfileUsersRequest();
    request.profileId = profileId;
    return this.getProfileUsersHandler.execute(request);
  }
}


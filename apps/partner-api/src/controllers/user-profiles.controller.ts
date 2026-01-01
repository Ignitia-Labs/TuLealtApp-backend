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
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
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
import { IUserRepository } from '@libs/domain';

/**
 * Controlador de asignaciones de perfiles a usuarios para Partner API
 * Permite gestionar qué perfiles están asignados a qué usuarios del partner
 *
 * Endpoints:
 * - POST /partner/user-profiles - Asignar un perfil a un usuario del partner
 * - DELETE /partner/user-profiles/:id - Remover asignación de perfil a usuario
 * - GET /partner/user-profiles/user/:userId - Obtener perfiles de un usuario del partner
 */
@ApiTags('Partner User Profiles')
@Controller('user-profiles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, PartnerResourceGuard)
@Roles('PARTNER', 'PARTNER_STAFF')
@ApiBearerAuth('JWT-auth')
@Injectable()
export class UserProfilesController {
  constructor(
    private readonly assignProfileToUserHandler: AssignProfileToUserHandler,
    private readonly removeProfileFromUserHandler: RemoveProfileFromUserHandler,
    private readonly getUserProfilesHandler: GetUserProfilesHandler,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('partner.staff.manage')
  @ApiOperation({
    summary: 'Asignar un perfil a un usuario del partner',
    description:
      'Asigna un perfil a un usuario del partner. Solo puede asignar perfiles a usuarios que pertenezcan al mismo partner. Si el usuario ya tiene el perfil asignado pero inactivo, se reactiva.',
  })
  @ApiBody({
    type: AssignProfileToUserRequest,
    description: 'Datos de la asignación de perfil a usuario. El assignedBy se obtiene del JWT automáticamente.',
    examples: {
      asignacionBasica: {
        summary: 'Asignación básica',
        description: 'Ejemplo de asignación de perfil a usuario del partner',
        value: {
          userId: 15,
          profileId: 5,
          assignedBy: 1,
        },
      },
      asignacionStaff: {
        summary: 'Asignar perfil a staff',
        description: 'Ejemplo de asignación de perfil a usuario PARTNER_STAFF',
        value: {
          userId: 16,
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
      id: 3,
      userId: 15,
      profileId: 5,
      assignedBy: 1,
      assignedAt: '2024-01-25T10:30:00.000Z',
      isActive: true,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['userId must be a number', 'profileId must be a number'],
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
    description: 'No tiene permisos suficientes o el usuario no pertenece a su partner',
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
    // Validar que el usuario objetivo pertenezca al mismo partner
    const targetUser = await this.userRepository.findById(request.userId);
    if (!targetUser) {
      throw new NotFoundException(`User with ID ${request.userId} not found`);
    }

    const currentUserEntity = await this.userRepository.findById(user.userId);
    if (!currentUserEntity || !currentUserEntity.partnerId) {
      throw new ForbiddenException('Current user does not belong to a partner');
    }

    if (targetUser.partnerId !== currentUserEntity.partnerId) {
      throw new ForbiddenException('You can only assign profiles to users from your partner');
    }

    // Asignar el userId del JWT al campo assignedBy
    request.assignedBy = user.userId;
    return this.assignProfileToUserHandler.execute(request);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('partner.staff.manage')
  @ApiOperation({
    summary: 'Remover asignación de perfil a usuario',
    description:
      'Remueve una asignación de perfil a usuario del partner (soft delete - desactiva la asignación). Solo puede remover asignaciones de usuarios de su partner.',
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
      id: 3,
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
    description: 'No tiene permisos suficientes o la asignación no pertenece a su partner',
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
    // El PartnerResourceGuard ya valida que la asignación pertenezca al partner
    const request = new RemoveProfileFromUserRequest();
    request.userProfileId = id;
    return this.removeProfileFromUserHandler.execute(request);
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @Permissions('partner.staff.view')
  @ApiOperation({
    summary: 'Obtener perfiles de un usuario del partner',
    description:
      'Obtiene todos los perfiles asignados a un usuario específico del partner. Solo puede ver usuarios de su partner.',
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
          id: 3,
          profileId: 5,
          profileName: 'Gerente de Tienda',
          profileDescription: 'Gestión de tiendas, productos, recompensas y reportes',
          permissions: ['partner.branches.*', 'partner.products.*', 'partner.reports.view'],
          assignedBy: 1,
          assignedAt: '2024-01-25T10:30:00.000Z',
          isActive: true,
        },
        {
          id: 4,
          profileId: 6,
          profileName: 'Vendedor',
          profileDescription: 'Operaciones de venta y atención al cliente',
          permissions: ['partner.transactions.create', 'partner.transactions.view'],
          assignedBy: 1,
          assignedAt: '2024-01-26T14:45:00.000Z',
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
    description: 'No tiene permisos suficientes o el usuario no pertenece a su partner',
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
    // El PartnerResourceGuard ya valida que el usuario pertenezca al partner
    const request = new GetUserProfilesRequest();
    request.userId = userId;
    return this.getUserProfilesHandler.execute(request);
  }
}


import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
  Inject,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import {
  GetUserPermissionsHandler,
  GetUserPermissionsRequest,
  GetUserPermissionsResponse,
  JwtPayload,
} from '@libs/application';
import {
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  NotFoundErrorResponseDto,
  InternalServerErrorResponseDto,
  JwtAuthGuard,
  RolesGuard,
  Roles,
  CurrentUser,
  PartnerResourceGuard,
} from '@libs/shared';
import { IUserRepository } from '@libs/domain';

/**
 * Controlador de permisos de usuarios para Partner API
 * Permite ver los permisos de usuarios del partner
 *
 * Endpoints:
 * - GET /partner/user-permissions/user/:userId - Obtener permisos de un usuario del partner
 */
@ApiTags('Partner User Permissions')
@Controller('user-permissions')
@UseGuards(JwtAuthGuard, RolesGuard, PartnerResourceGuard)
@Roles('PARTNER', 'PARTNER_STAFF')
@ApiBearerAuth('JWT-auth')
export class UserPermissionsController {
  constructor(
    private readonly getUserPermissionsHandler: GetUserPermissionsHandler,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener permisos de un usuario del partner',
    description:
      'Obtiene todos los permisos (directos y de perfiles) de un usuario específico del partner. Solo puede ver usuarios que pertenezcan al mismo partner. Los permisos incluyen tanto los asignados directamente como los que vienen de los perfiles asignados.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID único del usuario',
    type: Number,
    example: 15,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Permisos del usuario obtenidos exitosamente',
    type: GetUserPermissionsResponse,
    example: {
      permissions: [
        {
          id: 1,
          permissionId: 5,
          code: 'partner.products.create',
          module: 'partner',
          resource: 'products',
          action: 'create',
          description: 'Crear productos',
          assignedBy: 1,
          assignedAt: '2024-01-15T10:30:00.000Z',
          isActive: true,
        },
        {
          id: 2,
          permissionId: 6,
          code: 'partner.products.view',
          module: 'partner',
          resource: 'products',
          action: 'view',
          description: 'Ver productos',
          assignedBy: 1,
          assignedAt: '2024-01-15T10:30:00.000Z',
          isActive: true,
        },
        {
          id: 3,
          permissionId: 7,
          code: 'partner.reports.view',
          module: 'partner',
          resource: 'reports',
          action: 'view',
          description: 'Ver reportes',
          assignedBy: null,
          assignedAt: '2024-01-20T14:45:00.000Z',
          isActive: false,
        },
      ],
      total: 3,
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o el usuario no pertenece a su partner',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'You can only view permissions of users from your partner',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'User with ID 15 not found',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getUserPermissions(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<GetUserPermissionsResponse> {
    // Validar que el usuario objetivo pertenezca al mismo partner
    const targetUser = await this.userRepository.findById(userId);
    if (!targetUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const currentUserEntity = await this.userRepository.findById(user.userId);
    if (!currentUserEntity || !currentUserEntity.partnerId) {
      throw new ForbiddenException('Current user does not belong to a partner');
    }

    if (targetUser.partnerId !== currentUserEntity.partnerId) {
      throw new ForbiddenException('You can only view permissions of users from your partner');
    }

    const request = new GetUserPermissionsRequest();
    request.userId = userId;
    return this.getUserPermissionsHandler.execute(request);
  }
}

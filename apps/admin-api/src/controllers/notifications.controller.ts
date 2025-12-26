import {
  Controller,
  Get,
  Patch,
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
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  GetNotificationsHandler,
  GetNotificationsRequest,
  GetNotificationsResponse,
  MarkNotificationReadHandler,
  MarkNotificationReadRequest,
  MarkNotificationReadResponse,
  MarkAllNotificationsReadHandler,
  MarkAllNotificationsReadRequest,
  MarkAllNotificationsReadResponse,
} from '@libs/application';
import {
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  NotFoundErrorResponseDto,
  BadRequestErrorResponseDto,
  InternalServerErrorResponseDto,
} from '@libs/shared';
import { JwtAuthGuard, RolesGuard, Roles } from '@libs/shared';

/**
 * Controlador de Notifications para Admin API
 * Permite gestionar notificaciones
 *
 * Endpoints:
 * - GET /admin/notifications/user/:userId - Obtener notificaciones de un usuario
 * - PATCH /admin/notifications/:id/read - Marcar notificación como leída
 * - PATCH /admin/notifications/user/:userId/read-all - Marcar todas las notificaciones como leídas
 */
@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly getNotificationsHandler: GetNotificationsHandler,
    private readonly markNotificationReadHandler: MarkNotificationReadHandler,
    private readonly markAllNotificationsReadHandler: MarkAllNotificationsReadHandler,
  ) {}

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener notificaciones de un usuario',
    description:
      'Obtiene las notificaciones de un usuario específico. Permite filtrar solo no leídas.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID único del usuario',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Número de elementos a omitir (paginación)',
    example: 0,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Cantidad de elementos a retornar',
    example: 20,
  })
  @ApiQuery({
    name: 'unreadOnly',
    required: false,
    type: Boolean,
    description: 'Solo mostrar notificaciones no leídas',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Notificaciones obtenidas exitosamente',
    type: GetNotificationsResponse,
    example: {
      notifications: [
        {
          id: 1,
          userId: 1,
          type: 'points_earned',
          title: '¡Ganaste puntos!',
          message: 'Has ganado 100 puntos por tu compra',
          data: { points: 100 },
          read: false,
          createdAt: '2024-01-15T10:30:00.000Z',
        },
      ],
      unreadCount: 5,
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['userId must be a number', 'skip must be a number'],
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
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
    example: {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    },
  })
  async getNotifications(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('unreadOnly') unreadOnly?: string | boolean,
  ): Promise<GetNotificationsResponse> {
    const request = new GetNotificationsRequest();
    request.userId = userId;
    request.skip = skip ? parseInt(skip.toString(), 10) : undefined;
    request.take = take ? parseInt(take.toString(), 10) : undefined;
    request.unreadOnly = unreadOnly === true || unreadOnly === 'true' || unreadOnly === '1';
    return this.getNotificationsHandler.execute(request);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Marcar notificación como leída',
    description: 'Marca una notificación específica como leída.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la notificación',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Notificación marcada como leída exitosamente',
    type: MarkNotificationReadResponse,
    example: {
      id: 1,
      read: true,
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Notificación no encontrada',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Notification with ID 1 not found',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'ID de notificación inválido',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['id must be a number', 'id must be greater than or equal to 1'],
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
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
    example: {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    },
  })
  async markNotificationRead(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MarkNotificationReadResponse> {
    const request = new MarkNotificationReadRequest();
    request.notificationId = id;
    return this.markNotificationReadHandler.execute(request);
  }

  @Patch('user/:userId/read-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Marcar todas las notificaciones como leídas',
    description: 'Marca todas las notificaciones de un usuario como leídas.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID único del usuario',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Todas las notificaciones marcadas como leídas exitosamente',
    type: MarkAllNotificationsReadResponse,
    example: {
      message: 'All notifications marked as read',
      userId: 1,
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'ID de usuario inválido',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['userId must be a number', 'userId must be greater than or equal to 1'],
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
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
    example: {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    },
  })
  async markAllNotificationsRead(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<MarkAllNotificationsReadResponse> {
    const request = new MarkAllNotificationsReadRequest();
    request.userId = userId;
    return this.markAllNotificationsReadHandler.execute(request);
  }
}

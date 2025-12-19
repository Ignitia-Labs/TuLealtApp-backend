import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import {
  AuthenticateUserHandler,
  AuthenticateUserRequest,
  AuthenticateUserResponse,
  GetUserProfileHandler,
  GetUserProfileRequest,
  GetUserProfileResponse,
  JwtPayload,
} from '@libs/application';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@libs/shared';

/**
 * Controlador de autenticación para Admin API
 * Endpoints específicos para administradores
 *
 * Endpoints:
 * - POST /admin/auth/login - Iniciar sesión como administrador (requiere rol ADMIN)
 * - GET /admin/auth/me - Obtener perfil del administrador autenticado (requiere autenticación)
 */
@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly authenticateUserHandler: AuthenticateUserHandler,
    private readonly getUserProfileHandler: GetUserProfileHandler,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión como administrador' })
  @ApiBody({ type: AuthenticateUserRequest })
  @ApiResponse({
    status: 200,
    description: 'Autenticación exitosa',
    type: AuthenticateUserResponse,
    example: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: {
        id: 1,
        email: 'admin@example.com',
        name: 'Admin User',
        roles: ['ADMIN'],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o usuario no es administrador',
    example: {
      statusCode: 401,
      message: 'Credenciales inválidas o usuario no es administrador',
      error: 'Unauthorized',
    },
  })
  async login(@Body() request: AuthenticateUserRequest): Promise<AuthenticateUserResponse> {
    // Validar que el usuario tenga rol ADMIN y generar token con contexto 'admin'
    return this.authenticateUserHandler.execute(request, 'admin', 'ADMIN');
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del administrador autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil de administrador obtenido exitosamente',
    type: GetUserProfileResponse,
    example: {
      id: 1,
      email: 'admin@example.com',
      name: 'Admin User',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
      profile: null,
      roles: ['ADMIN'],
      isActive: true,
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-20T14:45:00.000Z',
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
    description: 'No tiene permisos de administrador',
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  async getProfile(@CurrentUser() user: JwtPayload): Promise<GetUserProfileResponse> {
    const request = new GetUserProfileRequest();
    request.userId = user.userId;
    return this.getUserProfileHandler.execute(request);
  }
}

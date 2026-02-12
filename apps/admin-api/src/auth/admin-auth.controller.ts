import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import {
  AuthenticateUserHandler,
  AuthenticateUserRequest,
  AuthenticateUserResponse,
  GetUserProfileHandler,
  GetUserProfileRequest,
  GetUserProfileResponse,
  UpdatePasswordHandler,
  UpdatePasswordRequest,
  UpdatePasswordResponse,
  UpdateMyProfileHandler,
  UpdateMyProfileRequest,
  UpdateMyProfileResponse,
  RefreshTokenHandler,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RevokeRefreshTokenHandler,
  RevokeRefreshTokenRequest,
  RevokeRefreshTokenResponse,
  JwtPayload,
} from '@libs/application';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@libs/shared';
import { Request } from 'express';

/**
 * Controlador de autenticación para Admin API
 * Endpoints específicos para administradores
 *
 * Endpoints:
 * - POST /admin/auth/login - Iniciar sesión como administrador (requiere rol ADMIN)
 * - POST /admin/auth/refresh - Refrescar access token usando refresh token
 * - POST /admin/auth/logout - Cerrar sesión y revocar refresh token
 * - GET /admin/auth/me - Obtener perfil del administrador autenticado (requiere autenticación)
 * - PATCH /admin/auth/me - Actualizar perfil del administrador autenticado (requiere autenticación)
 * - PATCH /admin/auth/password - Actualizar contraseña del administrador autenticado (requiere autenticación)
 */
@ApiTags('Auth')
@Controller('auth')
export class AdminAuthController {
  constructor(
    private readonly authenticateUserHandler: AuthenticateUserHandler,
    private readonly getUserProfileHandler: GetUserProfileHandler,
    private readonly updateMyProfileHandler: UpdateMyProfileHandler,
    private readonly updatePasswordHandler: UpdatePasswordHandler,
    private readonly refreshTokenHandler: RefreshTokenHandler,
    private readonly revokeRefreshTokenHandler: RevokeRefreshTokenHandler,
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
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refreshToken...',
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
  async login(
    @Body() request: AuthenticateUserRequest,
    @Req() req: Request,
  ): Promise<AuthenticateUserResponse> {
    // Validar que el usuario tenga rol ADMIN y generar token con contexto 'admin'
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;
    
    return this.authenticateUserHandler.execute(request, 'admin', 'ADMIN', userAgent, ipAddress);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
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

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar perfil del administrador autenticado',
    description:
      'Permite al administrador autenticado actualizar sus datos personales: nombre completo, nombre, apellido, email y teléfono. El email debe ser único y no puede estar en uso por otro usuario.',
  })
  @ApiBody({
    type: UpdateMyProfileRequest,
    description: 'Datos para actualizar el perfil',
    examples: {
      ejemplo1: {
        summary: 'Actualización completa de perfil',
        description: 'Ejemplo de actualización de todos los campos disponibles',
        value: {
          name: 'John Doe Updated',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe.updated@example.com',
          phone: '+9876543210',
        },
      },
      ejemplo2: {
        summary: 'Actualización parcial de perfil',
        description: 'Ejemplo de actualización solo del nombre y teléfono',
        value: {
          firstName: 'Jane',
          phone: '+1234567890',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado exitosamente',
    type: UpdateMyProfileResponse,
    example: {
      id: 1,
      email: 'john.doe.updated@example.com',
      name: 'John Doe Updated',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+9876543210',
      profile: null,
      roles: ['ADMIN'],
      isActive: true,
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-20T14:45:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o email ya en uso',
    example: {
      statusCode: 400,
      message: 'Email is already in use by another user',
      error: 'Bad Request',
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
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
    example: {
      statusCode: 404,
      message: 'User with ID 1 not found',
      error: 'Not Found',
    },
  })
  async updateMyProfile(
    @CurrentUser() user: JwtPayload,
    @Body() body: UpdateMyProfileRequest,
  ): Promise<UpdateMyProfileResponse> {
    return this.updateMyProfileHandler.execute(user.userId, body);
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar contraseña del administrador autenticado',
    description:
      'Permite al administrador autenticado actualizar su contraseña. Requiere proporcionar la contraseña actual para validación y la nueva contraseña.',
  })
  @ApiBody({
    type: UpdatePasswordRequest,
    description: 'Datos para actualizar la contraseña',
    examples: {
      ejemplo1: {
        summary: 'Actualización de contraseña básica',
        description: 'Ejemplo de actualización de contraseña con datos mínimos requeridos',
        value: {
          currentPassword: 'CurrentPass123!',
          newPassword: 'NewSecurePass456!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada exitosamente',
    type: UpdatePasswordResponse,
    example: {
      message: 'Contraseña actualizada exitosamente',
      userId: 1,
      updatedAt: '2024-01-20T14:45:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    example: {
      statusCode: 400,
      message: [
        'currentPassword must be longer than or equal to 6 characters',
        'newPassword must be longer than or equal to 6 characters',
        'currentPassword should not be empty',
      ],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado o contraseña actual incorrecta',
    example: {
      statusCode: 401,
      message: 'Current password is incorrect',
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
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
    example: {
      statusCode: 404,
      message: 'User with ID 1 not found',
      error: 'Not Found',
    },
  })
  async updatePassword(
    @CurrentUser() user: JwtPayload,
    @Body() body: Omit<UpdatePasswordRequest, 'userId'>,
  ): Promise<UpdatePasswordResponse> {
    const request = new UpdatePasswordRequest();
    request.userId = user.userId;
    request.currentPassword = body.currentPassword;
    request.newPassword = body.newPassword;
    return this.updatePasswordHandler.execute(request);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refrescar access token',
    description:
      'Genera un nuevo access token y refresh token usando un refresh token válido. Implementa estrategia de single-use tokens (el refresh token anterior se revoca automáticamente).',
  })
  @ApiBody({
    type: RefreshTokenRequest,
    description: 'Refresh token JWT',
    examples: {
      ejemplo1: {
        summary: 'Refresh token válido',
        value: {
          refreshToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCJ9.example',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens refrescados exitosamente',
    type: RefreshTokenResponse,
    example: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.newAccessToken...',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.newRefreshToken...',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido, expirado o revocado',
    example: {
      statusCode: 401,
      message: 'Invalid or expired refresh token',
      error: 'Unauthorized',
    },
  })
  async refreshToken(
    @Body() request: RefreshTokenRequest,
    @Req() req: Request,
  ): Promise<RefreshTokenResponse> {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;

    return this.refreshTokenHandler.execute(request, userAgent, ipAddress);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cerrar sesión',
    description:
      'Revoca el refresh token especificado (logout de un dispositivo) o todos los refresh tokens del usuario (logout de todos los dispositivos). Requiere autenticación con access token.',
  })
  @ApiBody({
    type: RevokeRefreshTokenRequest,
    description: 'Datos de logout',
    examples: {
      ejemplo1: {
        summary: 'Logout de un dispositivo específico',
        value: {
          refreshToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInR5cGUiOiJyZWZyZXNoIn0.example',
        },
      },
      ejemplo2: {
        summary: 'Logout de todos los dispositivos',
        value: {
          revokeAll: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logout exitoso',
    type: RevokeRefreshTokenResponse,
    example: {
      message: 'Logged out successfully',
      tokensRevoked: 1,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    example: {
      statusCode: 400,
      message: 'Either refreshToken or revokeAll must be provided',
      error: 'Bad Request',
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
  async logout(
    @CurrentUser() user: JwtPayload,
    @Body() request: RevokeRefreshTokenRequest,
  ): Promise<RevokeRefreshTokenResponse> {
    return this.revokeRefreshTokenHandler.execute(user.userId, request);
  }
}

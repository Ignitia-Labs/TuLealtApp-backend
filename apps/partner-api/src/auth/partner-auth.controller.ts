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
 * Controlador de autenticación para Partner API
 * Endpoints específicos para partners
 *
 * Endpoints:
 * - POST /partner/auth/login - Iniciar sesión como partner (requiere rol PARTNER)
 * - GET /partner/auth/me - Obtener perfil del partner autenticado (requiere autenticación)
 */
@ApiTags('Partner Auth')
@Controller('partner/auth')
export class PartnerAuthController {
  constructor(
    private readonly authenticateUserHandler: AuthenticateUserHandler,
    private readonly getUserProfileHandler: GetUserProfileHandler,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión como partner' })
  @ApiBody({ type: AuthenticateUserRequest })
  @ApiResponse({
    status: 200,
    description: 'Autenticación exitosa',
    type: AuthenticateUserResponse,
    example: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: {
        id: 1,
        email: 'partner@example.com',
        name: 'Partner Business',
        roles: ['PARTNER'],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o usuario no es partner',
    example: {
      statusCode: 401,
      message: 'Credenciales inválidas o usuario no es partner',
      error: 'Unauthorized',
    },
  })
  async login(@Body() request: AuthenticateUserRequest): Promise<AuthenticateUserResponse> {
    // Validar que el usuario tenga rol PARTNER y generar token con contexto 'partner'
    return this.authenticateUserHandler.execute(request, 'partner', 'PARTNER');
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARTNER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del partner autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil de partner obtenido exitosamente',
    type: GetUserProfileResponse,
    example: {
      id: 1,
      email: 'partner@example.com',
      name: 'Partner Business',
      firstName: 'Partner',
      lastName: 'Business',
      phone: '+1234567890',
      profile: null,
      roles: ['PARTNER'],
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
    description: 'No tiene permisos de partner',
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

import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import {
  RegisterUserHandler,
  RegisterUserRequest,
  RegisterUserResponse,
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
 * Controlador de autenticación para Customer API
 * Endpoints específicos para clientes
 *
 * Endpoints:
 * - POST /customer/auth/register - Registrar un nuevo cliente
 * - POST /customer/auth/login - Iniciar sesión como cliente (requiere rol CUSTOMER o sin rol específico)
 * - GET /customer/auth/me - Obtener perfil del cliente autenticado (requiere autenticación)
 */
@ApiTags('Customer Auth')
@Controller('customer/auth')
export class CustomerAuthController {
  constructor(
    private readonly registerUserHandler: RegisterUserHandler,
    private readonly authenticateUserHandler: AuthenticateUserHandler,
    private readonly getUserProfileHandler: GetUserProfileHandler,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo cliente' })
  @ApiBody({ type: RegisterUserRequest })
  @ApiResponse({
    status: 201,
    description: 'Cliente registrado exitosamente',
    type: RegisterUserResponse,
    example: {
      id: 1,
      email: 'customer@example.com',
      name: 'John Doe',
      createdAt: '2024-01-15T10:30:00.000Z',
    },
  })
  async register(@Body() request: RegisterUserRequest): Promise<RegisterUserResponse> {
    return this.registerUserHandler.execute(request);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión como cliente' })
  @ApiBody({ type: AuthenticateUserRequest })
  @ApiResponse({
    status: 200,
    description: 'Autenticación exitosa',
    type: AuthenticateUserResponse,
    example: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: {
        id: 1,
        email: 'customer@example.com',
        name: 'John Doe',
        roles: ['CUSTOMER'],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas',
    example: {
      statusCode: 401,
      message: 'Credenciales inválidas',
      error: 'Unauthorized',
    },
  })
  async login(@Body() request: AuthenticateUserRequest): Promise<AuthenticateUserResponse> {
    // Para customer, aceptamos usuarios con rol CUSTOMER o sin rol específico
    // Si el usuario tiene rol CUSTOMER, lo validamos; si no tiene rol específico, también es válido
    return this.authenticateUserHandler.execute(request, 'customer', 'CUSTOMER');
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del cliente autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil de cliente obtenido exitosamente',
    type: GetUserProfileResponse,
    example: {
      id: 1,
      email: 'customer@example.com',
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      profile: null,
      roles: ['CUSTOMER'],
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
  async getProfile(@CurrentUser() user: JwtPayload): Promise<GetUserProfileResponse> {
    const request = new GetUserProfileRequest();
    request.userId = user.userId;
    return this.getUserProfileHandler.execute(request);
  }
}


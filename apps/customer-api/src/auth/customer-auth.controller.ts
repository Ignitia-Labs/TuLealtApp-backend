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
  GetCustomerProfileResponse,
  JwtPayload,
} from '@libs/application';
import { JwtAuthGuard, CurrentUser } from '@libs/shared';

/**
 * Controlador de autenticación para Customer API
 * Endpoints específicos para clientes
 *
 * Endpoints:
 * - POST /customer/auth/register - Registrar un nuevo cliente
 * - POST /customer/auth/login - Iniciar sesión como cliente (requiere rol CUSTOMER o sin rol específico)
 * - GET /customer/auth/me - Obtener perfil del cliente autenticado (requiere autenticación)
 */
@ApiTags('Auth')
@Controller('auth')
export class CustomerAuthController {
  constructor(
    private readonly registerUserHandler: RegisterUserHandler,
    private readonly authenticateUserHandler: AuthenticateUserHandler,
    private readonly getUserProfileHandler: GetUserProfileHandler,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un nuevo cliente',
    description:
      'Registra un nuevo cliente. Puede registrarse de varias formas:\n' +
      '1. Con código de invitación (invitationCode)\n' +
      '2. Escaneando código del tenant (tenantQuickSearchCode)\n' +
      '3. Escaneando código de la branch (branchQuickSearchCode)\n' +
      '4. Con tenantId directo (tenantId y opcionalmente registrationBranchId)\n' +
      'Solo se puede proporcionar uno de estos métodos a la vez.',
  })
  @ApiBody({ type: RegisterUserRequest })
  @ApiResponse({
    status: 201,
    description:
      'Cliente registrado exitosamente. Si se proporcionaron tenantId y registrationBranchId, incluye información de la membership creada.',
    type: RegisterUserResponse,
    example: {
      id: 1,
      email: 'customer@example.com',
      name: 'John Doe',
      createdAt: '2024-01-15T10:30:00.000Z',
      membership: {
        id: 1,
        userId: 1,
        tenantId: 1,
        tenantName: 'Café Delicia',
        points: 0,
        qrCode: 'QR-USER-1-TENANT-1-A3B5C7',
        status: 'active',
        joinedDate: '2024-01-15T10:30:00.000Z',
      },
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener perfil del cliente autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil de cliente obtenido exitosamente',
    type: GetCustomerProfileResponse,
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
  async getProfile(@CurrentUser() user: JwtPayload): Promise<GetCustomerProfileResponse> {
    const request = new GetUserProfileRequest();
    request.userId = user.userId;
    const userProfile = await this.getUserProfileHandler.execute(request);
    
    // Transformar a respuesta específica para customer (sin campos de partner/tenant/branch)
    return GetCustomerProfileResponse.fromUserProfile(userProfile);
  }
}

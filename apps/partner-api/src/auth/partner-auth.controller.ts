import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import {
  AuthenticatePartnerUserHandler,
  AuthenticatePartnerUserRequest,
  AuthenticateUserResponse,
  GetUserProfileHandler,
  GetUserProfileRequest,
  GetUserProfileResponse,
  JwtPayload,
} from '@libs/application';
import {
  UnauthorizedErrorResponseDto,
  NotFoundErrorResponseDto,
  BadRequestErrorResponseDto,
  JwtAuthGuard,
  RolesGuard,
  Roles,
  CurrentUser,
} from '@libs/shared';

/**
 * Controlador de autenticación para Partner API
 * Endpoints específicos para partners
 *
 * Endpoints:
 * - POST /partner/auth/login - Iniciar sesión como partner (requiere dominio del partner y rol PARTNER o PARTNER_STAFF)
 * - GET /partner/auth/me - Obtener perfil del partner autenticado (requiere autenticación)
 */
@ApiTags('Partner Auth')
@Controller('partner/auth')
export class PartnerAuthController {
  constructor(
    private readonly authenticatePartnerUserHandler: AuthenticatePartnerUserHandler,
    private readonly getUserProfileHandler: GetUserProfileHandler,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión como usuario de partner',
    description:
      'Autentica un usuario que pertenece a un partner específico. Requiere el dominio del partner para identificar la organización. El usuario debe tener rol PARTNER o PARTNER_STAFF y pertenecer al partner especificado.',
  })
  @ApiBody({
    type: AuthenticatePartnerUserRequest,
    description: 'Datos de autenticación incluyendo el dominio del partner',
    examples: {
      ejemplo1: {
        summary: 'Login de partner owner',
        description: 'Ejemplo de login para un usuario con rol PARTNER',
        value: {
          email: 'owner@miempresa.gt',
          password: 'SecurePass123!',
          partnerDomain: 'miempresa.gt',
        },
      },
      ejemplo2: {
        summary: 'Login de partner staff',
        description: 'Ejemplo de login para un usuario con rol PARTNER_STAFF',
        value: {
          email: 'staff@miempresa.gt',
          password: 'SecurePass123!',
          partnerDomain: 'miempresa.gt',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticación exitosa',
    type: AuthenticateUserResponse,
    example: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: {
        id: 1,
        email: 'owner@miempresa.gt',
        name: 'Partner Owner',
        roles: ['PARTNER'],
      },
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
        'password must be longer than or equal to 6 characters',
        'partnerDomain should not be empty',
      ],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    description:
      'Credenciales inválidas, usuario no pertenece al partner o usuario no tiene rol de partner',
    type: UnauthorizedErrorResponseDto,
    example: {
      statusCode: 401,
      message:
        "User does not belong to partner 'miempresa.gt'. User belongs to a different partner.",
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Partner no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: "Partner with domain 'miempresa.gt' not found",
      error: 'Not Found',
    },
  })
  async login(@Body() request: AuthenticatePartnerUserRequest): Promise<AuthenticateUserResponse> {
    return this.authenticatePartnerUserHandler.execute(request);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARTNER', 'PARTNER_STAFF')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener perfil del usuario de partner autenticado',
    description:
      'Obtiene el perfil del usuario autenticado. El usuario debe tener rol PARTNER o PARTNER_STAFF y pertenecer a un partner.',
  })
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

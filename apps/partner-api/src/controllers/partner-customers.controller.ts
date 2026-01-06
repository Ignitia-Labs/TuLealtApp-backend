import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  Inject,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  GetPartnerCustomersHandler,
  GetPartnerCustomersRequest,
  GetPartnerCustomersResponse,
  CreateCustomerForPartnerHandler,
  CreateCustomerForPartnerRequest,
  CreateCustomerForPartnerResponse,
  CreateCustomerMembershipForPartnerHandler,
  CreateCustomerMembershipRequest,
  CreateCustomerMembershipResponse,
  GetCustomerByQrHandler,
  GetCustomerByQrRequest,
  GetCustomerByQrResponse,
  JwtPayload,
} from '@libs/application';
import { IUserRepository } from '@libs/domain';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  CurrentUser,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  BadRequestErrorResponseDto,
  InternalServerErrorResponseDto,
} from '@libs/shared';

/**
 * Controlador de partner customers para Partner API
 * Permite a los partners gestionar sus customers
 *
 * Endpoints:
 * - GET /partner/customers - Listar todos los customers del partner autenticado (con paginación)
 * - POST /partner/customers - Crear un nuevo customer con membership
 * - POST /partner/customers/:userId/memberships - Crear membership para un usuario existente
 */
@ApiTags('Partner Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PARTNER', 'PARTNER_STAFF')
@ApiBearerAuth('JWT-auth')
export class PartnerCustomersController {
  constructor(
    private readonly getPartnerCustomersHandler: GetPartnerCustomersHandler,
    private readonly createCustomerForPartnerHandler: CreateCustomerForPartnerHandler,
    private readonly createCustomerMembershipForPartnerHandler: CreateCustomerMembershipForPartnerHandler,
    private readonly getCustomerByQrHandler: GetCustomerByQrHandler,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar customers del partner',
    description:
      'Obtiene todos los customers asociados al partner del usuario autenticado. ' +
      'Incluye información de puntos y tier/ranking basado en las points rules del tenant. ' +
      'Si no se proporcionan parámetros de paginación (page, limit), retorna todos los customers. ' +
      'Si se proporcionan parámetros de paginación, retorna resultados paginados. ' +
      'El usuario debe tener rol PARTNER o PARTNER_STAFF y pertenecer a un partner.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (por defecto 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Límite de resultados por página (por defecto 50, máximo 100)',
    example: 50,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    description: 'Filtrar por status de la asociación',
    example: 'active',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de customers obtenida exitosamente',
    type: GetPartnerCustomersResponse,
    example: {
      data: [
        {
          id: 1,
          userId: 10,
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          customerPhone: '+1234567890',
          tenantId: 1,
          tenantName: 'Café Delicia - Centro',
          registrationBranchId: 5,
          registrationBranchName: 'Sucursal Centro',
          status: 'active',
          joinedDate: '2023-06-01T00:00:00.000Z',
          lastActivityDate: '2024-01-15T10:30:00.000Z',
          points: 1500,
          tierId: 2,
          tierName: 'Oro',
          tierColor: '#FFD700',
          tierPriority: 3,
          totalSpent: 2500.5,
          totalVisits: 25,
          qrCode: 'QR-USER-10-TENANT-1-A3B5C7',
          createdAt: '2023-06-01T00:00:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 1250,
        totalPages: 25,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para acceder a este recurso',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Partner no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getMyCustomers(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ): Promise<GetPartnerCustomersResponse> {
    // Obtener el partnerId del usuario autenticado
    const currentUser = await this.userRepository.findById(user.userId);
    if (!currentUser) {
      throw new NotFoundException(`User with ID ${user.userId} not found`);
    }

    if (!currentUser.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    const request = new GetPartnerCustomersRequest();
    request.partnerId = currentUser.partnerId;
    if (page) {
      request.page = parseInt(page, 10);
    }
    if (limit) {
      request.limit = parseInt(limit, 10);
    }
    if (status) {
      request.status = status as 'active' | 'inactive' | 'suspended';
    }

    return this.getPartnerCustomersHandler.execute(request);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo customer con membership',
    description:
      'Crea un nuevo customer (usuario) y su membership en un tenant del partner. Si el usuario ya existe, solo crea la membership. El tenant debe pertenecer al partner del usuario autenticado.',
  })
  @ApiBody({
    type: CreateCustomerForPartnerRequest,
    description: 'Datos del customer a crear',
    examples: {
      customerConBranch: {
        summary: 'Customer con branch',
        description: 'Crear customer con branch de registro específica',
        value: {
          email: 'customer@example.com',
          name: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          password: 'SecurePass123!',
          tenantId: 1,
          registrationBranchId: 5,
          points: 0,
          status: 'active',
        },
      },
      customerSinBranch: {
        summary: 'Customer sin branch',
        description: 'Crear customer sin branch de registro',
        value: {
          email: 'customer@example.com',
          name: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          password: 'SecurePass123!',
          tenantId: 1,
          points: 0,
          status: 'active',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Customer creado exitosamente',
    type: CreateCustomerForPartnerResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'El tenant no pertenece a tu partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una membership para este usuario y tenant',
    type: BadRequestErrorResponseDto,
  })
  async createCustomer(
    @CurrentUser() user: JwtPayload,
    @Body() request: CreateCustomerForPartnerRequest,
  ): Promise<CreateCustomerForPartnerResponse> {
    // Obtener el partnerId del usuario autenticado
    const currentUser = await this.userRepository.findById(user.userId);
    if (!currentUser) {
      throw new NotFoundException(`User with ID ${user.userId} not found`);
    }

    if (!currentUser.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    return this.createCustomerForPartnerHandler.execute(request, currentUser.partnerId);
  }

  @Post(':userId/memberships')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear membership para un usuario existente',
    description:
      'Crea una membership para un usuario existente en un tenant del partner. El tenant debe pertenecer al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID del usuario para el cual crear la membership',
    type: Number,
    example: 10,
  })
  @ApiBody({
    type: CreateCustomerMembershipRequest,
    description: 'Datos de la membership a crear',
    examples: {
      membershipConBranch: {
        summary: 'Membership con branch',
        description: 'Crear membership con branch de registro',
        value: {
          tenantId: 1,
          registrationBranchId: 5,
          points: 0,
          status: 'active',
        },
      },
      membershipSinBranch: {
        summary: 'Membership sin branch',
        description: 'Crear membership sin branch de registro',
        value: {
          tenantId: 1,
          points: 0,
          status: 'active',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Membership creada exitosamente',
    type: CreateCustomerMembershipResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'El tenant no pertenece a tu partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario o tenant no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una membership para este usuario y tenant',
    type: BadRequestErrorResponseDto,
  })
  async createMembership(
    @CurrentUser() user: JwtPayload,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() request: CreateCustomerMembershipRequest,
  ): Promise<CreateCustomerMembershipResponse> {
    // Obtener el partnerId del usuario autenticado
    const currentUser = await this.userRepository.findById(user.userId);
    if (!currentUser) {
      throw new NotFoundException(`User with ID ${user.userId} not found`);
    }

    if (!currentUser.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    // Asignar el userId del parámetro al request
    request.userId = userId;

    return this.createCustomerMembershipForPartnerHandler.execute(request, currentUser.partnerId);
  }

  @Get('by-qr/:qrCode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar customer por QR code',
    description:
      'Busca un customer por su código QR único. Retorna información completa del customer incluyendo balance de puntos y tier actual. El customer debe pertenecer al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'qrCode',
    description: 'Código QR único del customer',
    type: String,
    example: 'QR-USER-10-TENANT-1-A3B5C7',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Customer encontrado exitosamente',
    type: GetCustomerByQrResponse,
    example: {
      id: 1,
      userId: 10,
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+1234567890',
      tenantId: 1,
      tenantName: 'Café Delicia - Centro',
      registrationBranchId: 5,
      registrationBranchName: 'Sucursal Centro',
      status: 'active',
      joinedDate: '2023-06-01T00:00:00.000Z',
      lastActivityDate: '2024-01-15T10:30:00.000Z',
      points: 1500,
      tierId: 2,
      tierName: 'Oro',
      tierColor: '#FFD700',
      tierPriority: 3,
      totalSpent: 2500.5,
      totalVisits: 25,
      qrCode: 'QR-USER-10-TENANT-1-A3B5C7',
      createdAt: '2023-06-01T00:00:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['qrCode should not be empty', 'qrCode must be a string'],
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
    description: 'No tiene permisos suficientes o el customer no pertenece a tu partner',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Customer does not belong to your partner',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Customer no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Customer with QR code QR-USER-10-TENANT-1-A3B5C7 not found',
      error: 'Not Found',
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
  async getCustomerByQr(
    @CurrentUser() user: JwtPayload,
    @Param('qrCode') qrCode: string,
  ): Promise<GetCustomerByQrResponse> {
    // Obtener el partnerId del usuario autenticado
    const currentUser = await this.userRepository.findById(user.userId);
    if (!currentUser) {
      throw new NotFoundException(`User with ID ${user.userId} not found`);
    }

    if (!currentUser.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    const request = new GetCustomerByQrRequest();
    request.qrCode = qrCode;

    return this.getCustomerByQrHandler.execute(request, currentUser.partnerId);
  }
}

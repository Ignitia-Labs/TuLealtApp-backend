import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
  ApiExtraModels,
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
  GetCustomerMembershipHandler,
  GetCustomerMembershipRequest,
  GetCustomerMembershipResponse,
  UpdateCustomerMembershipHandler,
  UpdateCustomerMembershipRequest,
  UpdateCustomerMembershipResponse,
  DeleteCustomerMembershipHandler,
  DeleteCustomerMembershipRequest,
  DeleteCustomerMembershipResponse,
  GetCustomerPointsTransactionsHandler,
  GetCustomerPointsTransactionsRequest,
  GetPointsTransactionsResponse,
  CreatePointsAdjustmentHandler,
  CreatePointsAdjustmentRequest,
  CreatePointsAdjustmentResponse,
  CreatePointsReversalHandler,
  CreatePointsReversalRequest,
  CreatePointsReversalResponse,
  GetAvailableRewardsHandler,
  GetAvailableRewardsRequest,
  GetAvailableRewardsResponse,
  RedeemRewardHandler,
  RedeemRewardRequest,
  RedeemRewardResponse,
  JwtPayload,
} from '@libs/application';
import { IUserRepository, ICustomerMembershipRepository, ITenantRepository } from '@libs/domain';
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
 * - GET /partner/customers/:id - Obtener customer por ID (membershipId)
 * - PATCH /partner/customers/:id - Actualizar customer
 * - DELETE /partner/customers/:id - Eliminar customer
 * - GET /partner/customers/:id/points-transactions - Obtener historial de transacciones
 * - POST /partner/customers/:id/points/adjustment - Crear ajuste manual de puntos
 * - POST /partner/customers/:id/points/reversal - Revertir transacción de puntos
 * - GET /partner/customers/:id/rewards - Obtener recompensas disponibles para un customer
 * - POST /partner/customers/:id/rewards/:rewardId/redeem - Procesar canje de recompensa
 */
@ApiTags('Partner Customers')
@ApiExtraModels(
  CreatePointsAdjustmentRequest,
  CreatePointsAdjustmentResponse,
  CreatePointsReversalRequest,
  CreatePointsReversalResponse,
  GetAvailableRewardsRequest,
  GetAvailableRewardsResponse,
  RedeemRewardRequest,
  RedeemRewardResponse,
)
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
    private readonly getCustomerMembershipHandler: GetCustomerMembershipHandler,
    private readonly updateCustomerMembershipHandler: UpdateCustomerMembershipHandler,
    private readonly deleteCustomerMembershipHandler: DeleteCustomerMembershipHandler,
    private readonly getCustomerPointsTransactionsHandler: GetCustomerPointsTransactionsHandler,
    private readonly createPointsAdjustmentHandler: CreatePointsAdjustmentHandler,
    private readonly createPointsReversalHandler: CreatePointsReversalHandler,
    private readonly getAvailableRewardsHandler: GetAvailableRewardsHandler,
    private readonly redeemRewardHandler: RedeemRewardHandler,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
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

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener customer por ID',
    description:
      'Obtiene la información completa de un customer (membership) por su ID. El ID corresponde al membershipId de la relación customer-tenant. El customer debe pertenecer al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la membership (customer)',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Customer encontrado exitosamente',
    type: GetCustomerMembershipResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o el customer no pertenece a tu partner',
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
      message: 'Membership with ID 1 not found',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getCustomer(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GetCustomerMembershipResponse> {
    // Obtener el partnerId del usuario autenticado
    const currentUser = await this.userRepository.findById(user.userId);
    if (!currentUser) {
      throw new NotFoundException(`User with ID ${user.userId} not found`);
    }

    if (!currentUser.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    // Verificar que la membership existe y pertenece al partner
    const membership = await this.membershipRepository.findById(id);
    if (!membership) {
      throw new NotFoundException(`Membership with ID ${id} not found`);
    }

    // Verificar que el tenant pertenece al partner del usuario autenticado
    const tenant = await this.tenantRepository.findById(membership.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${membership.tenantId} not found`);
    }

    if (tenant.partnerId !== currentUser.partnerId) {
      throw new ForbiddenException('Customer does not belong to your partner');
    }

    const request = new GetCustomerMembershipRequest();
    request.membershipId = id;
    return this.getCustomerMembershipHandler.execute(request);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar customer',
    description:
      'Actualiza parcialmente la información de un customer (membership). Permite actualizar puntos, tier, estado, total gastado, visitas y fecha de última visita. El customer debe pertenecer al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la membership (customer) a actualizar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiBody({
    type: UpdateCustomerMembershipRequest,
    description: 'Datos a actualizar (todos los campos son opcionales)',
    examples: {
      actualizarPuntos: {
        summary: 'Actualizar puntos',
        description: 'Actualizar solo los puntos del customer',
        value: {
          points: 2500,
        },
      },
      actualizarEstado: {
        summary: 'Actualizar estado',
        description: 'Cambiar el estado del customer',
        value: {
          status: 'inactive',
        },
      },
      actualizarMultiple: {
        summary: 'Actualizar múltiples campos',
        description: 'Actualizar varios campos a la vez',
        value: {
          points: 3000,
          tierId: 2,
          totalSpent: 5000.5,
          totalVisits: 35,
          status: 'active',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Customer actualizado exitosamente',
    type: UpdateCustomerMembershipResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o el customer no pertenece a tu partner',
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
      message: 'Membership with ID 1 not found',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async updateCustomer(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Omit<UpdateCustomerMembershipRequest, 'membershipId'>,
  ): Promise<UpdateCustomerMembershipResponse> {
    // Obtener el partnerId del usuario autenticado
    const currentUser = await this.userRepository.findById(user.userId);
    if (!currentUser) {
      throw new NotFoundException(`User with ID ${user.userId} not found`);
    }

    if (!currentUser.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    // Verificar que la membership existe y pertenece al partner
    const membership = await this.membershipRepository.findById(id);
    if (!membership) {
      throw new NotFoundException(`Membership with ID ${id} not found`);
    }

    // Verificar que el tenant pertenece al partner del usuario autenticado
    const tenant = await this.tenantRepository.findById(membership.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${membership.tenantId} not found`);
    }

    if (tenant.partnerId !== currentUser.partnerId) {
      throw new ForbiddenException('Customer does not belong to your partner');
    }

    const request = new UpdateCustomerMembershipRequest();
    request.membershipId = id;
    // Copiar todos los campos del body al request
    Object.assign(request, body);

    return this.updateCustomerMembershipHandler.execute(request);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar customer',
    description:
      'Elimina una membership (relación customer-tenant). Esta acción elimina la relación del customer con el tenant específico y decrementa el contador de customers en la suscripción del partner. El customer debe pertenecer al partner del usuario autenticado. Esta acción es irreversible.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la membership (customer) a eliminar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Customer eliminado exitosamente',
    type: DeleteCustomerMembershipResponse,
    example: {
      membershipId: 1,
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o el customer no pertenece a tu partner',
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
      message: 'Membership with ID 1 not found',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async deleteCustomer(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteCustomerMembershipResponse> {
    // Obtener el partnerId del usuario autenticado
    const currentUser = await this.userRepository.findById(user.userId);
    if (!currentUser) {
      throw new NotFoundException(`User with ID ${user.userId} not found`);
    }

    if (!currentUser.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    // Verificar que la membership existe y pertenece al partner
    const membership = await this.membershipRepository.findById(id);
    if (!membership) {
      throw new NotFoundException(`Membership with ID ${id} not found`);
    }

    // Verificar que el tenant pertenece al partner del usuario autenticado
    const tenant = await this.tenantRepository.findById(membership.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${membership.tenantId} not found`);
    }

    if (tenant.partnerId !== currentUser.partnerId) {
      throw new ForbiddenException('Customer does not belong to your partner');
    }

    const request = new DeleteCustomerMembershipRequest();
    request.membershipId = id;
    return this.deleteCustomerMembershipHandler.execute(request);
  }

  @Get(':id/points-transactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener historial de transacciones de puntos de un customer',
    description:
      'Obtiene el historial completo de transacciones de puntos de un customer (membership). El customer debe pertenecer al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la membership (customer)',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiQuery({
    name: 'type',
    enum: ['EARNING', 'REDEEM', 'ADJUSTMENT', 'REVERSAL', 'EXPIRATION', 'all'],
    required: false,
    description: 'Filtrar por tipo de transacción',
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    type: String,
    description: 'Fecha de inicio (ISO 8601)',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    type: String,
    description: 'Fecha de fin (ISO 8601)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
    default: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Elementos por página',
    default: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de transacciones obtenido exitosamente',
    type: GetPointsTransactionsResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o el customer no pertenece a tu partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Customer no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async getCustomerPointsTransactions(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<GetPointsTransactionsResponse> {
    // Obtener el partnerId del usuario autenticado
    const currentUser = await this.userRepository.findById(user.userId);
    if (!currentUser) {
      throw new NotFoundException(`User with ID ${user.userId} not found`);
    }

    if (!currentUser.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    const request = new GetCustomerPointsTransactionsRequest();
    request.membershipId = id;
    request.type = (type as any) || 'all';
    request.fromDate = fromDate;
    request.toDate = toDate;
    request.page = page || 1;
    request.limit = limit || 20;

    return this.getCustomerPointsTransactionsHandler.execute(request, currentUser.partnerId);
  }

  @Post(':id/points/adjustment')
  @HttpCode(HttpStatus.CREATED)
  @Roles('PARTNER', 'ADMIN') // Solo PARTNER o ADMIN pueden crear ajustes
  @ApiOperation({
    summary: 'Crear ajuste manual de puntos',
    description:
      'Crea un ajuste manual de puntos para un customer. Solo usuarios con rol PARTNER o ADMIN pueden crear ajustes. El customer debe pertenecer al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la membership (customer)',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiBody({
    type: CreatePointsAdjustmentRequest,
    description: 'Datos del ajuste de puntos',
    examples: {
      agregarPuntos: {
        summary: 'Agregar puntos',
        description: 'Ejemplo de ajuste para agregar puntos',
        value: {
          pointsDelta: 100,
          reasonCode: 'BONUS_BIRTHDAY',
          metadata: {
            birthdayMonth: 1,
          },
        },
      },
      agregarPuntosConBranch: {
        summary: 'Agregar puntos con sucursal',
        description: 'Ejemplo de ajuste para agregar puntos registrando la sucursal',
        value: {
          pointsDelta: 100,
          reasonCode: 'BONUS_BIRTHDAY',
          branchId: 2,
          metadata: {
            birthdayMonth: 1,
            appliedBy: 'Store Manager',
          },
        },
      },
      quitarPuntos: {
        summary: 'Quitar puntos',
        description: 'Ejemplo de ajuste para quitar puntos',
        value: {
          pointsDelta: -50,
          reasonCode: 'PENALTY',
          metadata: {
            reason: 'Policy violation',
          },
        },
      },
      quitarPuntosConBranch: {
        summary: 'Quitar puntos con sucursal',
        description: 'Ejemplo de ajuste para quitar puntos registrando la sucursal',
        value: {
          pointsDelta: -50,
          reasonCode: 'CORRECTION',
          branchId: 3,
          metadata: {
            reason: 'Duplicate transaction',
            originalTransactionId: 1234,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Ajuste creado exitosamente',
    type: CreatePointsAdjustmentResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o el ajuste resultaría en balance negativo',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o el customer no pertenece a tu partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Customer no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async createPointsAdjustment(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreatePointsAdjustmentRequest,
  ): Promise<CreatePointsAdjustmentResponse> {
    body.membershipId = id;
    const createdBy = `USER_${user.userId}`;

    // Obtener el partnerId del usuario autenticado
    const currentUser = await this.userRepository.findById(user.userId);
    if (!currentUser) {
      throw new NotFoundException(`User with ID ${user.userId} not found`);
    }
    if (!currentUser.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    return this.createPointsAdjustmentHandler.execute(body, currentUser.partnerId, createdBy);
  }

  @Post(':id/points/reversal')
  @HttpCode(HttpStatus.CREATED)
  @Roles('PARTNER', 'ADMIN') // Solo PARTNER o ADMIN pueden crear reversiones
  @ApiOperation({
    summary: 'Revertir transacción de puntos',
    description:
      'Crea una reversión de una transacción de puntos existente. Solo usuarios con rol PARTNER o ADMIN pueden crear reversiones. El customer debe pertenecer al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la membership (customer)',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiBody({
    type: CreatePointsReversalRequest,
    description: 'Datos de la reversión',
    examples: {
      reversionRefund: {
        summary: 'Reversión por reembolso',
        description: 'Ejemplo de reversión por reembolso',
        value: {
          transactionId: 1001,
          reasonCode: 'REFUND',
          metadata: {
            refundReason: 'Customer requested refund',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Reversión creada exitosamente',
    type: CreatePointsReversalResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o la transacción ya fue revertida',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o el customer no pertenece a tu partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Customer o transacción no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async createPointsReversal(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreatePointsReversalRequest,
  ): Promise<CreatePointsReversalResponse> {
    body.membershipId = id;
    const createdBy = `USER_${user.userId}`;

    // Obtener el partnerId del usuario autenticado
    const currentUser = await this.userRepository.findById(user.userId);
    if (!currentUser) {
      throw new NotFoundException(`User with ID ${user.userId} not found`);
    }
    if (!currentUser.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    return this.createPointsReversalHandler.execute(body, currentUser.partnerId, createdBy);
  }

  @Get(':id/rewards')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener recompensas disponibles para un customer',
    description:
      'Obtiene las recompensas que el customer puede canjear con sus puntos actuales. ' +
      'Las recompensas están filtradas por disponibilidad, puntos suficientes y límites de canje. ' +
      'El customer debe pertenecer al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la membership (customer)',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de recompensas disponibles obtenida exitosamente',
    type: GetAvailableRewardsResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o el customer no pertenece a tu partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Customer no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async getCustomerAvailableRewards(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) membershipId: number,
  ): Promise<GetAvailableRewardsResponse> {
    // Obtener el partnerId del usuario autenticado
    const currentUser = await this.userRepository.findById(user.userId);
    if (!currentUser) {
      throw new NotFoundException(`User with ID ${user.userId} not found`);
    }

    if (!currentUser.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    // Verificar que la membership existe y pertenece al partner
    const membership = await this.membershipRepository.findById(membershipId);
    if (!membership) {
      throw new NotFoundException(`Membership with ID ${membershipId} not found`);
    }

    // Verificar que el tenant pertenece al partner del usuario autenticado
    const tenant = await this.tenantRepository.findById(membership.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${membership.tenantId} not found`);
    }

    if (tenant.partnerId !== currentUser.partnerId) {
      throw new ForbiddenException('Customer does not belong to your partner');
    }

    // Obtener recompensas disponibles
    const request = new GetAvailableRewardsRequest();
    request.membershipId = membershipId;
    return this.getAvailableRewardsHandler.execute(request);
  }

  @Post(':id/rewards/:rewardId/redeem')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Canjear recompensa para un customer',
    description:
      'Procesa el canje de una recompensa usando los puntos del customer. ' +
      'Valida que el customer tenga puntos suficientes, que la recompensa esté disponible ' +
      'y que no se haya alcanzado el límite de canjes. El customer debe pertenecer al partner del usuario autenticado. ' +
      'Opcionalmente se puede incluir branchId para registrar la sucursal donde se realizó el canje.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la membership (customer)',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiParam({
    name: 'rewardId',
    description: 'ID de la recompensa a canjear',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiBody({
    type: RedeemRewardRequest,
    description: 'Datos del canje de recompensa (opcional: incluir branchId)',
    required: false,
    examples: {
      canjeBasico: {
        summary: 'Canje básico',
        description: 'Canje sin especificar sucursal',
        value: {},
      },
      canjeConBranch: {
        summary: 'Canje con sucursal',
        description: 'Canje registrando la sucursal donde se realizó',
        value: {
          branchId: 2,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Recompensa canjeada exitosamente',
    type: RedeemRewardResponse,
  })
  @ApiResponse({
    status: 400,
    description:
      'No se puede canjear (puntos insuficientes, límite alcanzado, recompensa no disponible)',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o el customer no pertenece a tu partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Customer o recompensa no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async redeemRewardForCustomer(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) membershipId: number,
    @Param('rewardId', ParseIntPipe) rewardId: number,
    @Body() body?: Partial<RedeemRewardRequest>,
  ): Promise<RedeemRewardResponse> {
    // Obtener el partnerId del usuario autenticado
    const currentUser = await this.userRepository.findById(user.userId);
    if (!currentUser) {
      throw new NotFoundException(`User with ID ${user.userId} not found`);
    }

    if (!currentUser.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    // Verificar que la membership existe y pertenece al partner
    const membership = await this.membershipRepository.findById(membershipId);
    if (!membership) {
      throw new NotFoundException(`Membership with ID ${membershipId} not found`);
    }

    // Verificar que el tenant pertenece al partner del usuario autenticado
    const tenant = await this.tenantRepository.findById(membership.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${membership.tenantId} not found`);
    }

    if (tenant.partnerId !== currentUser.partnerId) {
      throw new ForbiddenException('Customer does not belong to your partner');
    }

    // Procesar canje
    const request = new RedeemRewardRequest();
    request.membershipId = membershipId;
    request.rewardId = rewardId;
    // Incluir branchId si se proporciona en el body
    if (body?.branchId) {
      request.branchId = body.branchId;
    }
    return this.redeemRewardHandler.execute(request);
  }
}

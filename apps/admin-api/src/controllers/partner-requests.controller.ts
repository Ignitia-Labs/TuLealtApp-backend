import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CreatePartnerRequestHandler,
  CreatePartnerRequestRequest,
  CreatePartnerRequestResponse,
  GetPartnerRequestHandler,
  GetPartnerRequestRequest,
  GetPartnerRequestResponse,
  GetPartnerRequestsHandler,
  GetPartnerRequestsRequest,
  GetPartnerRequestsResponse,
  UpdatePartnerRequestStatusHandler,
  UpdatePartnerRequestStatusRequest,
  UpdatePartnerRequestStatusResponse,
  AddPartnerRequestNotesHandler,
  AddPartnerRequestNotesRequest,
  AddPartnerRequestNotesResponse,
  RejectPartnerRequestHandler,
  RejectPartnerRequestRequest,
  RejectPartnerRequestResponse,
  ProcessPartnerRequestHandler,
  ProcessPartnerRequestRequest,
  ProcessPartnerRequestResponse,
} from '@libs/application';
import {
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  BadRequestErrorResponseDto,
  NotFoundErrorResponseDto,
  InternalServerErrorResponseDto,
} from '@libs/shared';

/**
 * Controlador de Partner Requests para Admin API
 * Permite gestionar las solicitudes de onboarding de partners
 *
 * Endpoints:
 * - POST /admin/partner-requests - Crear una nueva solicitud
 * - GET /admin/partner-requests - Obtener todas las solicitudes (con filtros opcionales)
 * - GET /admin/partner-requests/:id - Obtener solicitud por ID
 * - PATCH /admin/partner-requests/:id/status - Actualizar estado de la solicitud
 * - PATCH /admin/partner-requests/:id/notes - Agregar/actualizar notas
 * - PATCH /admin/partner-requests/:id/reject - Rechazar solicitud
 * - POST /admin/partner-requests/:id/process - Procesar solicitud (convertir a partner)
 */
@ApiTags('Partner Requests')
@Controller('partner-requests')
export class PartnerRequestsController {
  constructor(
    private readonly createPartnerRequestHandler: CreatePartnerRequestHandler,
    private readonly getPartnerRequestHandler: GetPartnerRequestHandler,
    private readonly getPartnerRequestsHandler: GetPartnerRequestsHandler,
    private readonly updatePartnerRequestStatusHandler: UpdatePartnerRequestStatusHandler,
    private readonly addPartnerRequestNotesHandler: AddPartnerRequestNotesHandler,
    private readonly rejectPartnerRequestHandler: RejectPartnerRequestHandler,
    private readonly processPartnerRequestHandler: ProcessPartnerRequestHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear solicitud de partner',
    description:
      'Crea una nueva solicitud de onboarding de partner. La solicitud se crea con estado "pending" por defecto.',
  })
  @ApiBody({
    type: CreatePartnerRequestRequest,
    examples: {
      example1: {
        summary: 'Solicitud completa',
        value: {
          name: 'Restaurante La Cocina del Sol',
          responsibleName: 'Roberto Méndez',
          email: 'roberto@cocinasol.gt',
          phone: '+502 3333-4444',
          countryId: 1,
          city: 'Antigua Guatemala',
          plan: 'conecta',
          logo: 'https://ui-avatars.com/api/?name=Cocina+Sol&background=f97316&color=fff',
          category: 'Restaurantes',
          branchesNumber: 3,
          website: 'https://cocinasol.gt',
          socialMedia: '@cocinadelsolgt',
          rewardType: 'Por monto de compra',
          currencyId: 'currency-8',
          businessName: 'La Cocina del Sol S.A.',
          taxId: '12345678-9',
          fiscalAddress: '5ta Avenida Norte #10, Antigua Guatemala',
          paymentMethod: 'Tarjeta de crédito',
          billingEmail: 'facturacion@cocinasol.gt',
          notes: 'Nueva solicitud pendiente de revisión',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitud creada exitosamente',
    type: CreatePartnerRequestResponse,
    example: {
      id: 1,
      status: 'pending',
      submittedAt: '2024-11-14T09:30:00Z',
      name: 'Restaurante La Cocina del Sol',
      email: 'roberto@cocinasol.gt',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o ya existe una solicitud con ese email',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async createPartnerRequest(
    @Body() request: CreatePartnerRequestRequest,
  ): Promise<CreatePartnerRequestResponse> {
    return this.createPartnerRequestHandler.execute(request);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener todas las solicitudes de partners',
    description:
      'Obtiene todas las solicitudes de partners con opción de filtrar por estado y paginación.',
  })
  @ApiQuery({
    name: 'status',
    description: 'Filtrar por estado de la solicitud',
    enum: ['pending', 'in-progress', 'enrolled', 'rejected'],
    required: false,
  })
  @ApiQuery({
    name: 'skip',
    description: 'Número de registros a omitir (paginación)',
    type: Number,
    required: false,
    example: 0,
  })
  @ApiQuery({
    name: 'take',
    description: 'Número máximo de registros a retornar (paginación)',
    type: Number,
    required: false,
    example: 100,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de solicitudes obtenida exitosamente',
    type: GetPartnerRequestsResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getPartnerRequests(
    @Query('status') status?: 'pending' | 'in-progress' | 'enrolled' | 'rejected',
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ): Promise<GetPartnerRequestsResponse> {
    const request = new GetPartnerRequestsRequest();
    request.status = status;
    request.skip = skip ? parseInt(skip.toString(), 10) : undefined;
    request.take = take ? parseInt(take.toString(), 10) : undefined;
    return this.getPartnerRequestsHandler.execute(request);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener solicitud de partner por ID',
    description: 'Obtiene los detalles completos de una solicitud de partner por su ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la solicitud',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitud obtenida exitosamente',
    type: GetPartnerRequestResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Solicitud no encontrada',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getPartnerRequest(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GetPartnerRequestResponse> {
    const request = new GetPartnerRequestRequest();
    request.id = id;
    return this.getPartnerRequestHandler.execute(request);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar estado de solicitud',
    description:
      'Actualiza el estado de una solicitud de partner. Permite cambiar entre: pending, in-progress, enrolled, rejected.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la solicitud',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiBody({
    type: UpdatePartnerRequestStatusRequest,
    examples: {
      markInProgress: {
        summary: 'Marcar como en progreso',
        value: {
          requestId: 1,
          status: 'in-progress',
          assignedTo: 1,
        },
      },
      markEnrolled: {
        summary: 'Marcar como inscrita',
        value: {
          requestId: 1,
          status: 'enrolled',
        },
      },
      reject: {
        summary: 'Rechazar solicitud',
        value: {
          requestId: 1,
          status: 'rejected',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado exitosamente',
    type: UpdatePartnerRequestStatusResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o transición de estado no permitida',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Solicitud no encontrada',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async updatePartnerRequestStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Omit<UpdatePartnerRequestStatusRequest, 'requestId'>,
  ): Promise<UpdatePartnerRequestStatusResponse> {
    const request = new UpdatePartnerRequestStatusRequest();
    request.requestId = id;
    request.status = body.status;
    request.assignedTo = body.assignedTo;
    return this.updatePartnerRequestStatusHandler.execute(request);
  }

  @Patch(':id/notes')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Agregar o actualizar notas de solicitud',
    description:
      'Agrega o actualiza las notas de una solicitud de partner. Útil para agregar comentarios o seguimiento.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la solicitud',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiBody({
    type: AddPartnerRequestNotesRequest,
    examples: {
      example1: {
        summary: 'Agregar notas',
        value: {
          requestId: 1,
          notes: 'Revisando documentación fiscal',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Notas actualizadas exitosamente',
    type: AddPartnerRequestNotesResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Solicitud no encontrada',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async addPartnerRequestNotes(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Omit<AddPartnerRequestNotesRequest, 'requestId'>,
  ): Promise<AddPartnerRequestNotesResponse> {
    const request = new AddPartnerRequestNotesRequest();
    request.requestId = id;
    request.notes = body.notes;
    return this.addPartnerRequestNotesHandler.execute(request);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Rechazar solicitud de partner',
    description:
      'Rechaza una solicitud de partner. Solo se pueden rechazar solicitudes con estado "pending" o "in-progress".',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la solicitud a rechazar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitud rechazada exitosamente',
    type: RejectPartnerRequestResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede rechazar una solicitud ya inscrita o ya rechazada',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Solicitud no encontrada',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async rejectPartnerRequest(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RejectPartnerRequestResponse> {
    const request = new RejectPartnerRequestRequest();
    request.requestId = id;
    return this.rejectPartnerRequestHandler.execute(request);
  }

  @Post(':id/process')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Procesar solicitud de partner',
    description:
      'Procesa una solicitud de partner convirtiéndola en un partner activo. Crea el partner con sus suscripción, límites y estadísticas iniciales, y marca la solicitud como "enrolled".',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la solicitud a procesar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiBody({
    type: ProcessPartnerRequestRequest,
    required: false,
    examples: {
      example1: {
        summary: 'Procesar con valores por defecto',
        value: {},
      },
      example2: {
        summary: 'Procesar con valores personalizados',
        value: {
          requestId: 1,
          subscriptionPlanId: 'plan-conecta',
          subscriptionStartDate: '2024-01-01T00:00:00Z',
          subscriptionRenewalDate: '2025-01-01T00:00:00Z',
          subscriptionLastPaymentAmount: 99.0,
          subscriptionAutoRenew: true,
          limitsMaxTenants: 5,
          limitsMaxBranches: 20,
          limitsMaxCustomers: 5000,
          limitsMaxRewards: 50,
          domain: 'cocinasol.gt',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitud procesada exitosamente y partner creado',
    type: ProcessPartnerRequestResponse,
    example: {
      partnerId: 1,
      requestId: 1,
      requestStatus: 'enrolled',
      partnerName: 'Restaurante La Cocina del Sol',
      partnerEmail: 'roberto@cocinasol.gt',
      partnerDomain: 'cocinasol.gt',
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'No se puede procesar una solicitud ya procesada o rechazada, o el dominio ya existe',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Solicitud no encontrada',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async processPartnerRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: Omit<ProcessPartnerRequestRequest, 'requestId'>,
  ): Promise<ProcessPartnerRequestResponse> {
    const request = new ProcessPartnerRequestRequest();
    request.requestId = id;
    if (body) {
      Object.assign(request, body);
    }
    return this.processPartnerRequestHandler.execute(request);
  }
}

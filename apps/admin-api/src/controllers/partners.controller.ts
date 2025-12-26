import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
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
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CreatePartnerHandler,
  CreatePartnerRequest,
  CreatePartnerResponse,
  GetPartnerHandler,
  GetPartnerRequest,
  GetPartnerResponse,
  GetPartnersHandler,
  GetPartnersRequest,
  GetPartnersResponse,
  UpdatePartnerHandler,
  UpdatePartnerRequest,
  UpdatePartnerResponse,
  DeletePartnerHandler,
  DeletePartnerRequest,
  DeletePartnerResponse,
} from '@libs/application';
import {
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  BadRequestErrorResponseDto,
  NotFoundErrorResponseDto,
  InternalServerErrorResponseDto,
  CurrentUser,
  JwtAuthGuard,
} from '@libs/shared';
import { JwtPayload } from '@libs/application';

/**
 * Controlador de partners para Admin API
 * Permite gestionar partners del sistema
 *
 * Endpoints:
 * - GET /admin/partners - Obtener todos los partners
 * - POST /admin/partners - Crear un nuevo partner
 * - GET /admin/partners/:id - Obtener partner por ID
 * - PATCH /admin/partners/:id - Actualizar partner (actualización parcial)
 * - DELETE /admin/partners/:id - Eliminar partner
 */
@ApiTags('Partners')
@Controller('partners')
export class PartnersController {
  constructor(
    private readonly createPartnerHandler: CreatePartnerHandler,
    private readonly getPartnerHandler: GetPartnerHandler,
    private readonly getPartnersHandler: GetPartnersHandler,
    private readonly updatePartnerHandler: UpdatePartnerHandler,
    private readonly deletePartnerHandler: DeletePartnerHandler,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todos los partners',
    description:
      'Obtiene la lista completa de partners del sistema. Por defecto solo devuelve partners activos. Permite filtrar para incluir partners inactivos o suspendidos mediante el parámetro query includeInactive.',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Si se incluyen partners inactivos o suspendidos en la respuesta',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de partners obtenida exitosamente',
    type: GetPartnersResponse,
    example: {
      partners: [
        {
          id: 1,
          name: 'Grupo Comercial ABC',
          responsibleName: 'María González',
          email: 'maria@abc-comercial.com',
          phone: '+502 2345-6789',
          countryId: 1,
          city: 'Ciudad de Guatemala',
          plan: 'conecta',
          logo: 'https://ui-avatars.com/api/?name=Grupo+ABC&background=4f46e5&color=fff',
          category: 'Retail',
          branchesNumber: 5,
          website: 'https://abc-comercial.com',
          socialMedia: '@abccomercial',
          rewardType: 'Por monto de compra',
          currencyId: 'currency-8',
          businessName: 'Grupo Comercial ABC S.A. de C.V.',
          taxId: 'RFC-ABC-123456',
          fiscalAddress: 'Zona 10, Guatemala City, Guatemala',
          paymentMethod: 'Tarjeta de crédito',
          billingEmail: 'facturacion@abc-comercial.com',
          domain: 'abc-comercial.com',
          subscription: {
            planId: 'plan-conecta',
            startDate: '2024-01-01T00:00:00Z',
            renewalDate: '2025-01-01T00:00:00Z',
            status: 'active',
            lastPaymentDate: '2024-01-01T00:00:00Z',
            lastPaymentAmount: 99.0,
            paymentStatus: 'paid',
            autoRenew: true,
          },
          limits: {
            maxTenants: 5,
            maxBranches: 20,
            maxCustomers: 5000,
            maxRewards: 50,
          },
          stats: {
            tenantsCount: 3,
            branchesCount: 8,
            customersCount: 1250,
            rewardsCount: 15,
          },
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-11-01T00:00:00Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['includeInactive must be a boolean value'],
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
    example: {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    },
  })
  async getPartners(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<GetPartnersResponse> {
    const request = new GetPartnersRequest();
    request.includeInactive = includeInactive === 'true';
    return this.getPartnersHandler.execute(request);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo partner',
    description:
      'Crea un nuevo partner en el sistema con sus datos básicos, suscripción, límites y estadísticas iniciales.',
  })
  @ApiBody({
    type: CreatePartnerRequest,
    description: 'Datos del partner a crear',
    examples: {
      ejemplo1: {
        summary: 'Partner básico',
        description: 'Ejemplo de creación de partner con datos mínimos',
        value: {
          name: 'Grupo Comercial ABC',
          responsibleName: 'María González',
          email: 'maria@abc-comercial.com',
          phone: '+502 2345-6789',
          countryId: 1,
          city: 'Ciudad de Guatemala',
          plan: 'conecta',
          category: 'Retail',
          rewardType: 'Por monto de compra',
          currencyId: 'currency-8',
          businessName: 'Grupo Comercial ABC S.A. de C.V.',
          taxId: 'RFC-ABC-123456',
          fiscalAddress: 'Zona 10, Guatemala City, Guatemala',
          paymentMethod: 'Tarjeta de crédito',
          billingEmail: 'facturacion@abc-comercial.com',
          domain: 'abc-comercial.com',
          subscriptionPlanId: 'plan-conecta',
          subscriptionStartDate: '2024-01-01T00:00:00Z',
          subscriptionRenewalDate: '2025-01-01T00:00:00Z',
          subscriptionLastPaymentAmount: 99.0,
          subscriptionAutoRenew: true,
          limitsMaxTenants: 5,
          limitsMaxBranches: 20,
          limitsMaxCustomers: 5000,
          limitsMaxRewards: 50,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Partner creado exitosamente',
    type: CreatePartnerResponse,
    example: {
      id: 1,
      name: 'Grupo Comercial ABC',
      email: 'maria@abc-comercial.com',
      domain: 'abc-comercial.com',
      plan: 'conecta',
      status: 'active',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    example: {
      statusCode: 400,
      message: ['email must be an email', 'name should not be empty', 'domain should not be empty'],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 409,
    description: 'El partner ya existe (email o dominio duplicado)',
    example: {
      statusCode: 409,
      message: 'Partner with this email already exists',
      error: 'Conflict',
    },
  })
  async createPartner(@Body() request: CreatePartnerRequest): Promise<CreatePartnerResponse> {
    return this.createPartnerHandler.execute(request);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener partner por ID',
    description: 'Obtiene la información completa de un partner por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del partner',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Partner encontrado',
    type: GetPartnerResponse,
    example: {
      id: 1,
      name: 'Grupo Comercial ABC',
      responsibleName: 'María González',
      email: 'maria@abc-comercial.com',
      phone: '+502 2345-6789',
      countryId: 1,
      city: 'Ciudad de Guatemala',
      plan: 'conecta',
      logo: 'https://ui-avatars.com/api/?name=Grupo+ABC&background=4f46e5&color=fff',
      category: 'Retail',
      branchesNumber: 5,
      website: 'https://abc-comercial.com',
      socialMedia: '@abccomercial',
      rewardType: 'Por monto de compra',
      currencyId: 'currency-8',
      businessName: 'Grupo Comercial ABC S.A. de C.V.',
      taxId: 'RFC-ABC-123456',
      fiscalAddress: 'Zona 10, Guatemala City, Guatemala',
      paymentMethod: 'Tarjeta de crédito',
      billingEmail: 'facturacion@abc-comercial.com',
      domain: 'abc-comercial.com',
      subscription: {
        planId: 'plan-conecta',
        startDate: '2024-01-01T00:00:00Z',
        renewalDate: '2025-01-01T00:00:00Z',
        status: 'active',
        lastPaymentDate: '2024-01-01T00:00:00Z',
        lastPaymentAmount: 99,
        paymentStatus: 'paid',
        autoRenew: true,
      },
      limits: {
        maxTenants: 5,
        maxBranches: 20,
        maxCustomers: 5000,
        maxRewards: 50,
      },
      stats: {
        tenantsCount: 3,
        branchesCount: 8,
        customersCount: 1250,
        rewardsCount: 15,
      },
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-11-01T00:00:00Z',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Partner no encontrado',
    example: {
      statusCode: 404,
      message: 'Partner with ID 1 not found',
      error: 'Not Found',
    },
  })
  async getPartner(@Param('id', ParseIntPipe) id: number): Promise<GetPartnerResponse> {
    try {
      console.log(`[PartnersController] getPartner llamado con ID: ${id}`);
      const request = new GetPartnerRequest();
      request.partnerId = id;
      console.log(`[PartnersController] Ejecutando handler para partner ID: ${id}`);
      const result = await this.getPartnerHandler.execute(request);
      console.log(`[PartnersController] Handler completado exitosamente para partner ID: ${id}`);
      return result;
    } catch (error) {
      console.error(`[PartnersController] Error en getPartner para ID ${id}:`, error);
      throw error;
    }
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar partner',
    description:
      'Actualiza un partner existente. Todos los campos son opcionales, solo se actualizarán los campos enviados (actualización parcial PATCH).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del partner a actualizar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiBody({
    type: UpdatePartnerRequest,
    description: 'Datos del partner a actualizar (todos los campos son opcionales)',
    examples: {
      ejemplo1: {
        summary: 'Actualizar solo nombre y email',
        description: 'Ejemplo de actualización parcial de solo algunos campos',
        value: {
          name: 'Grupo Comercial ABC Actualizado',
          email: 'nuevo-email@abc-comercial.com',
        },
      },
      ejemplo2: {
        summary: 'Actualizar información fiscal',
        description: 'Ejemplo de actualización de información fiscal y de contacto',
        value: {
          businessName: 'Grupo Comercial ABC S.A. Actualizado',
          taxId: 'RFC-ABC-999999',
          fiscalAddress: 'Nueva dirección fiscal, Zona 15',
          billingEmail: 'nueva-facturacion@abc-comercial.com',
        },
      },
      ejemplo3: {
        summary: 'Suspender partner',
        description: 'Ejemplo de suspensión de partner cambiando su estado',
        value: {
          status: 'suspended',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Partner actualizado exitosamente',
    type: UpdatePartnerResponse,
    example: {
      id: 1,
      name: 'Grupo Comercial ABC Actualizado',
      responsibleName: 'María González',
      email: 'nuevo-email@abc-comercial.com',
      phone: '+502 2345-6789',
      countryId: 1,
      city: 'Ciudad de Guatemala',
      plan: 'conecta',
      logo: 'https://ui-avatars.com/api/?name=Grupo+ABC&background=4f46e5&color=fff',
      category: 'Retail',
      branchesNumber: 5,
      website: 'https://abc-comercial.com',
      socialMedia: '@abccomercial',
      rewardType: 'Por monto de compra',
      currencyId: 'currency-8',
      businessName: 'Grupo Comercial ABC S.A. Actualizado',
      taxId: 'RFC-ABC-999999',
      fiscalAddress: 'Nueva dirección fiscal, Zona 15',
      paymentMethod: 'Tarjeta de crédito',
      billingEmail: 'nueva-facturacion@abc-comercial.com',
      domain: 'abc-comercial.com',
      status: 'active',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: [
        'name must be longer than or equal to 2 characters',
        'email must be an email',
        'status must be one of the following values: active, suspended, inactive',
      ],
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
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Partner no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Partner with ID 1 not found',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto (email o dominio duplicado)',
    example: {
      statusCode: 409,
      message: 'Partner with this email already exists',
      error: 'Conflict',
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
  async updatePartner(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdatePartnerRequest,
  ): Promise<UpdatePartnerResponse> {
    return this.updatePartnerHandler.execute(id, request);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Eliminar partner',
    description:
      'Elimina un partner del sistema. Antes de eliminar, archiva toda la información del partner y sus relaciones (suscripción, límites, estadísticas, tenants con sus features y branches) en la tabla de archivo. Los registros originales se eliminan después del archivado. Esta acción es irreversible.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del partner a eliminar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Partner eliminado exitosamente',
    type: DeletePartnerResponse,
    example: {
      message: 'Partner deleted successfully',
      id: 1,
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
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Partner no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Partner with ID 1 not found',
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async deletePartner(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<DeletePartnerResponse> {
    const request = new DeletePartnerRequest();
    request.partnerId = id;
    request.deletedBy = user?.userId || null;
    return this.deletePartnerHandler.execute(request);
  }
}

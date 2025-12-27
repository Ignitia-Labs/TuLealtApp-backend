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
  CreateTenantHandler,
  CreateTenantRequest,
  CreateTenantResponse,
  GetTenantHandler,
  GetTenantRequest,
  GetTenantResponse,
  GetTenantsByPartnerHandler,
  GetTenantsByPartnerRequest,
  GetTenantsByPartnerResponse,
  UpdateTenantHandler,
  UpdateTenantRequest,
  UpdateTenantResponse,
  DeleteTenantHandler,
  DeleteTenantRequest,
  DeleteTenantResponse,
} from '@libs/application';
import {
  BadRequestErrorResponseDto,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  InternalServerErrorResponseDto,
  JwtAuthGuard,
} from '@libs/shared';

/**
 * Controlador de tenants para Admin API
 * Permite gestionar tenants del sistema
 *
 * Endpoints:
 * - GET /admin/tenants?partnerId={id} - Listar tenants por partner
 * - POST /admin/tenants - Crear un nuevo tenant
 * - GET /admin/tenants/:id - Obtener tenant por ID
 * - PATCH /admin/tenants/:id - Actualizar tenant (actualización parcial)
 * - DELETE /admin/tenants/:id - Eliminar tenant
 */
@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly createTenantHandler: CreateTenantHandler,
    private readonly getTenantHandler: GetTenantHandler,
    private readonly getTenantsByPartnerHandler: GetTenantsByPartnerHandler,
    private readonly updateTenantHandler: UpdateTenantHandler,
    private readonly deleteTenantHandler: DeleteTenantHandler,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar tenants por partner',
    description:
      'Obtiene la lista de todos los tenants asociados a un partner específico. Requiere el parámetro query partnerId.',
  })
  @ApiQuery({
    name: 'partnerId',
    required: true,
    type: Number,
    description: 'ID del partner para filtrar los tenants',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de tenants obtenida exitosamente',
    type: GetTenantsByPartnerResponse,
    example: {
      tenants: [
        {
          id: 1,
          partnerId: 1,
          name: 'Café Delicia',
          description: 'Cafetería gourmet con sabor artesanal',
          logo: 'https://ui-avatars.com/api/?name=Cafe+Delicia&background=ec4899&color=fff',
          category: 'Cafeterías',
          currencyId: 'currency-8',
          primaryColor: '#ec4899',
          secondaryColor: '#fbbf24',
          pointsExpireDays: 365,
          minPointsToRedeem: 100,
          status: 'active',
          createdAt: '2024-01-05T00:00:00.000Z',
          updatedAt: '2024-01-05T00:00:00.000Z',
          qrScanning: true,
          offlineMode: true,
          referralProgram: true,
          birthdayRewards: true,
        },
        {
          id: 2,
          partnerId: 1,
          name: 'Restaurante El Buen Sabor',
          description: 'Restaurante familiar con comida tradicional',
          logo: 'https://ui-avatars.com/api/?name=Restaurante+El+Buen+Sabor&background=4f46e5&color=fff',
          category: 'Restaurantes',
          currencyId: 'currency-8',
          primaryColor: '#4f46e5',
          secondaryColor: '#fbbf24',
          pointsExpireDays: 180,
          minPointsToRedeem: 50,
          status: 'active',
          createdAt: '2024-01-10T00:00:00.000Z',
          updatedAt: '2024-01-10T00:00:00.000Z',
          qrScanning: false,
          offlineMode: true,
          referralProgram: true,
          birthdayRewards: false,
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
      message: ['partnerId must be a number', 'partnerId must be greater than or equal to 1'],
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
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
    example: {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    },
  })
  async getTenantsByPartner(
    @Query('partnerId', ParseIntPipe) partnerId: number,
  ): Promise<GetTenantsByPartnerResponse> {
    const request = new GetTenantsByPartnerRequest();
    request.partnerId = partnerId;
    return this.getTenantsByPartnerHandler.execute(request);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear un nuevo tenant',
    description:
      'Crea un nuevo tenant (negocio) asociado a un partner con sus características configuradas.',
  })
  @ApiBody({
    type: CreateTenantRequest,
    description: 'Datos del tenant a crear',
    examples: {
      ejemplo1: {
        summary: 'Tenant básico',
        description: 'Ejemplo de creación de tenant con datos mínimos',
        value: {
          partnerId: 1,
          name: 'Café Delicia',
          category: 'Cafeterías',
          currencyId: 'currency-8',
          primaryColor: '#ec4899',
          secondaryColor: '#fbbf24',
          description: 'Cafetería gourmet con sabor artesanal',
          pointsExpireDays: 365,
          minPointsToRedeem: 100,
          qrScanning: true,
          offlineMode: true,
          referralProgram: true,
          birthdayRewards: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Tenant creado exitosamente',
    type: CreateTenantResponse,
    example: {
      id: 1,
      partnerId: 1,
      name: 'Café Delicia',
      category: 'Cafeterías',
      status: 'active',
      createdAt: '2024-01-05T00:00:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    example: {
      statusCode: 400,
      message: [
        'partnerId must be a number',
        'name should not be empty',
        'primaryColor should not be empty',
      ],
      error: 'Bad Request',
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
  async createTenant(@Body() request: CreateTenantRequest): Promise<CreateTenantResponse> {
    return this.createTenantHandler.execute(request);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener tenant por ID',
    description: 'Obtiene la información completa de un tenant por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del tenant',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant encontrado',
    type: GetTenantResponse,
    example: {
      id: 1,
      partnerId: 1,
      name: 'Café Delicia',
      description: 'Cafetería gourmet con sabor artesanal',
      logo: 'https://ui-avatars.com/api/?name=Cafe+Delicia&background=ec4899&color=fff',
      category: 'Cafeterías',
      currencyId: 'currency-8',
      primaryColor: '#ec4899',
      secondaryColor: '#fbbf24',
      pointsExpireDays: 365,
      minPointsToRedeem: 100,
      status: 'active',
      createdAt: '2024-01-05T00:00:00.000Z',
      updatedAt: '2024-01-05T00:00:00.000Z',
      qrScanning: true,
      offlineMode: true,
      referralProgram: true,
      birthdayRewards: true,
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Tenant with ID 1 not found',
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
  async getTenant(@Param('id', ParseIntPipe) id: number): Promise<GetTenantResponse> {
    const request = new GetTenantRequest();
    request.tenantId = id;
    return this.getTenantHandler.execute(request);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar tenant',
    description:
      'Actualiza un tenant existente. Todos los campos son opcionales, solo se actualizarán los campos enviados (actualización parcial PATCH).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del tenant a actualizar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiBody({
    type: UpdateTenantRequest,
    description: 'Datos del tenant a actualizar (todos los campos son opcionales)',
    examples: {
      ejemplo1: {
        summary: 'Actualizar solo nombre y descripción',
        description: 'Ejemplo de actualización parcial de solo algunos campos',
        value: {
          name: 'Café Delicia Premium',
          description: 'Cafetería gourmet premium con sabor artesanal',
        },
      },
      ejemplo2: {
        summary: 'Actualizar colores y características',
        description: 'Ejemplo de actualización de colores y características del tenant',
        value: {
          primaryColor: '#ff6b6b',
          secondaryColor: '#4ecdc4',
          qrScanning: false,
          offlineMode: true,
        },
      },
      ejemplo3: {
        summary: 'Suspender tenant',
        description: 'Ejemplo de suspensión de tenant cambiando su estado',
        value: {
          status: 'suspended',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant actualizado exitosamente',
    type: UpdateTenantResponse,
    example: {
      id: 1,
      partnerId: 1,
      name: 'Café Delicia Premium',
      description: 'Cafetería gourmet premium con sabor artesanal',
      logo: 'https://ui-avatars.com/api/?name=Cafe+Delicia&background=ec4899&color=fff',
      category: 'Cafeterías',
      currencyId: 'currency-8',
      primaryColor: '#ff6b6b',
      secondaryColor: '#4ecdc4',
      pointsExpireDays: 365,
      minPointsToRedeem: 100,
      status: 'active',
      createdAt: '2024-01-05T00:00:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z',
      qrScanning: true,
      offlineMode: true,
      referralProgram: true,
      birthdayRewards: true,
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
        'status must be one of the following values: active, inactive, suspended',
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
    description: 'Tenant no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Tenant with ID 1 not found',
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
  async updateTenant(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateTenantRequest,
  ): Promise<UpdateTenantResponse> {
    return this.updateTenantHandler.execute(id, request);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Eliminar tenant',
    description:
      'Elimina un tenant del sistema. Esta acción eliminará también las características asociadas (cascada).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del tenant a eliminar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant eliminado exitosamente',
    type: DeleteTenantResponse,
    example: {
      message: 'Tenant deleted successfully',
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
    description: 'Tenant no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Tenant with ID 1 not found',
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
  async deleteTenant(@Param('id', ParseIntPipe) id: number): Promise<DeleteTenantResponse> {
    const request = new DeleteTenantRequest();
    request.tenantId = id;
    return this.deleteTenantHandler.execute(request);
  }
}

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
  GetCustomerTiersHandler,
  GetCustomerTiersRequest,
  GetCustomerTiersResponse,
  GetCustomerTierHandler,
  GetCustomerTierRequest,
  GetCustomerTierResponse,
  CreateCustomerTierHandler,
  CreateCustomerTierRequest,
  CreateCustomerTierResponse,
  UpdateCustomerTierHandler,
  UpdateCustomerTierRequest,
  UpdateCustomerTierResponse,
  DeleteCustomerTierHandler,
  DeleteCustomerTierRequest,
  DeleteCustomerTierResponse,
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
 * Controlador de Customer Tiers para Admin API
 * Permite gestionar los niveles/tiers de clientes del sistema
 *
 * Endpoints:
 * - GET /admin/customer-tiers?tenantId={id} - Listar niveles de clientes por tenant
 * - POST /admin/customer-tiers - Crear un nuevo nivel de cliente
 * - GET /admin/customer-tiers/:id - Obtener nivel de cliente por ID
 * - PATCH /admin/customer-tiers/:id - Actualizar nivel de cliente (actualización parcial)
 * - DELETE /admin/customer-tiers/:id - Eliminar nivel de cliente
 */
@ApiTags('Customer Tiers')
@Controller('customer-tiers')
export class CustomerTiersController {
  constructor(
    private readonly getCustomerTiersHandler: GetCustomerTiersHandler,
    private readonly getCustomerTierHandler: GetCustomerTierHandler,
    private readonly createCustomerTierHandler: CreateCustomerTierHandler,
    private readonly updateCustomerTierHandler: UpdateCustomerTierHandler,
    private readonly deleteCustomerTierHandler: DeleteCustomerTierHandler,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Listar niveles de clientes por tenant',
    description:
      'Obtiene la lista de todos los niveles de clientes asociados a un tenant específico. Requiere el parámetro query tenantId.',
  })
  @ApiQuery({
    name: 'tenantId',
    required: true,
    type: Number,
    description: 'ID del tenant para filtrar los niveles de clientes',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de niveles de clientes obtenida exitosamente',
    type: GetCustomerTiersResponse,
    example: {
      tiers: [
        {
          id: 1,
          tenantId: 1,
          name: 'Bronce',
          description: 'Nivel inicial para nuevos clientes',
          minPoints: 0,
          maxPoints: 1000,
          color: '#cd7f32',
          benefits: ['Descuento del 5%'],
          multiplier: null,
          icon: 'bronze',
          priority: 1,
          status: 'active',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
        {
          id: 2,
          tenantId: 1,
          name: 'Plata',
          description: 'Nivel intermedio',
          minPoints: 1000,
          maxPoints: 5000,
          color: '#c0c0c0',
          benefits: ['Descuento del 10%', 'Envío gratis'],
          multiplier: 1.05,
          icon: 'silver',
          priority: 2,
          status: 'active',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
        {
          id: 3,
          tenantId: 1,
          name: 'Oro',
          description: 'Nivel avanzado',
          minPoints: 5000,
          maxPoints: null,
          color: '#ffd700',
          benefits: ['Descuento del 15%', 'Envío gratis', 'Acceso a productos exclusivos'],
          multiplier: 1.1,
          icon: 'gold',
          priority: 3,
          status: 'active',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
      ],
      total: 3,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['tenantId must be a number', 'tenantId must be greater than or equal to 1'],
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
  async getCustomerTiers(
    @Query('tenantId', ParseIntPipe) tenantId: number,
  ): Promise<GetCustomerTiersResponse> {
    const request = new GetCustomerTiersRequest();
    request.tenantId = tenantId;
    return this.getCustomerTiersHandler.execute(request);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear un nuevo nivel de cliente',
    description:
      'Crea un nuevo nivel/tier de cliente asociado a un tenant con su configuración completa.',
  })
  @ApiBody({
    type: CreateCustomerTierRequest,
    description: 'Datos del nivel de cliente a crear',
    examples: {
      ejemplo1: {
        summary: 'Tier básico',
        description: 'Ejemplo de creación de tier con datos mínimos',
        value: {
          tenantId: 1,
          name: 'Bronce',
          minPoints: 0,
          maxPoints: 1000,
          color: '#cd7f32',
          benefits: ['Descuento del 5%'],
        },
      },
      ejemplo2: {
        summary: 'Tier completo',
        description: 'Ejemplo de creación de tier con todas las opciones',
        value: {
          tenantId: 1,
          name: 'Oro',
          description: 'Nivel avanzado para clientes VIP',
          minPoints: 5000,
          maxPoints: null,
          color: '#ffd700',
          benefits: ['Descuento del 15%', 'Envío gratis', 'Acceso a productos exclusivos'],
          multiplier: 1.1,
          icon: 'gold',
          priority: 3,
          status: 'active',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Nivel de cliente creado exitosamente',
    type: CreateCustomerTierResponse,
    example: {
      tier: {
        id: 1,
        tenantId: 1,
        name: 'Bronce',
        description: 'Nivel inicial para nuevos clientes',
        minPoints: 0,
        maxPoints: 1000,
        color: '#cd7f32',
        benefits: ['Descuento del 5%'],
        multiplier: null,
        icon: 'bronze',
        priority: 1,
        status: 'active',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
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
        'tenantId must be a number',
        'name should not be empty',
        'color must be a valid hexadecimal color code',
        'maxPoints must be greater than minPoints',
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
  async createCustomerTier(
    @Body() request: CreateCustomerTierRequest,
  ): Promise<CreateCustomerTierResponse> {
    return this.createCustomerTierHandler.execute(request);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener nivel de cliente por ID',
    description: 'Obtiene la información completa de un nivel de cliente por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del nivel de cliente',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Nivel de cliente encontrado',
    type: GetCustomerTierResponse,
    example: {
      tier: {
        id: 1,
        tenantId: 1,
        name: 'Bronce',
        description: 'Nivel inicial para nuevos clientes',
        minPoints: 0,
        maxPoints: 1000,
        color: '#cd7f32',
        benefits: ['Descuento del 5%'],
        multiplier: null,
        icon: 'bronze',
        priority: 1,
        status: 'active',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
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
    description: 'Nivel de cliente no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Customer tier with ID 1 not found',
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
  async getCustomerTier(@Param('id', ParseIntPipe) id: number): Promise<GetCustomerTierResponse> {
    const request = new GetCustomerTierRequest();
    request.customerTierId = id;
    return this.getCustomerTierHandler.execute(request);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar nivel de cliente',
    description:
      'Actualiza un nivel de cliente existente. Todos los campos son opcionales, solo se actualizarán los campos enviados (actualización parcial PATCH).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del nivel de cliente a actualizar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiBody({
    type: UpdateCustomerTierRequest,
    description: 'Datos del nivel de cliente a actualizar (todos los campos son opcionales)',
    examples: {
      ejemplo1: {
        summary: 'Actualizar solo nombre y descripción',
        description: 'Ejemplo de actualización parcial de solo algunos campos',
        value: {
          name: 'Bronce actualizado',
          description: 'Nivel inicial mejorado para nuevos clientes',
        },
      },
      ejemplo2: {
        summary: 'Actualizar beneficios y multiplicador',
        description: 'Ejemplo de actualización de beneficios y multiplicador',
        value: {
          benefits: ['Descuento del 5%', 'Envío gratis', 'Acceso anticipado'],
          multiplier: 1.05,
        },
      },
      ejemplo3: {
        summary: 'Actualizar estado',
        description: 'Ejemplo de desactivación de tier',
        value: {
          status: 'inactive',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Nivel de cliente actualizado exitosamente',
    type: UpdateCustomerTierResponse,
    example: {
      tier: {
        id: 1,
        tenantId: 1,
        name: 'Bronce actualizado',
        description: 'Nivel inicial mejorado para nuevos clientes',
        minPoints: 0,
        maxPoints: 1000,
        color: '#cd7f32',
        benefits: ['Descuento del 5%', 'Envío gratis'],
        multiplier: null,
        icon: 'bronze',
        priority: 1,
        status: 'active',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-20T14:45:00.000Z',
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
        'color must be a valid hexadecimal color code',
        'maxPoints must be greater than minPoints',
        'multiplier must be greater than or equal to 1.0',
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
    description: 'Nivel de cliente no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Customer tier with ID 1 not found',
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
  async updateCustomerTier(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateCustomerTierRequest,
  ): Promise<UpdateCustomerTierResponse> {
    return this.updateCustomerTierHandler.execute(id, request);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Eliminar nivel de cliente',
    description: 'Elimina un nivel de cliente del sistema.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del nivel de cliente a eliminar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Nivel de cliente eliminado exitosamente',
    type: DeleteCustomerTierResponse,
    example: {
      message: 'Customer tier deleted successfully',
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
    description: 'Nivel de cliente no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Customer tier with ID 1 not found',
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
  async deleteCustomerTier(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteCustomerTierResponse> {
    const request = new DeleteCustomerTierRequest();
    request.customerTierId = id;
    return this.deleteCustomerTierHandler.execute(request);
  }
}

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
  GetCatalogsHandler,
  GetCatalogsRequest,
  GetCatalogsResponse,
  GetCatalogHandler,
  GetCatalogRequest,
  GetCatalogResponse,
  CreateCatalogHandler,
  CreateCatalogRequest,
  CreateCatalogResponse,
  UpdateCatalogHandler,
  UpdateCatalogRequest,
  UpdateCatalogResponse,
  DeleteCatalogHandler,
  DeleteCatalogRequest,
  DeleteCatalogResponse,
} from '@libs/application';
import {
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  BadRequestErrorResponseDto,
  NotFoundErrorResponseDto,
  InternalServerErrorResponseDto,
  JwtAuthGuard,
} from '@libs/shared';

/**
 * Controlador de catálogos para Admin API
 * Permite gestionar los catálogos configurables del sistema (categorías, tipos de recompensas, métodos de pago)
 *
 * Endpoints:
 * - GET /admin/catalogs - Obtener todos los catálogos o filtrar por tipo
 * - POST /admin/catalogs - Crear un nuevo elemento de catálogo
 * - GET /admin/catalogs/:id - Obtener elemento de catálogo por ID
 * - PATCH /admin/catalogs/:id - Actualizar elemento de catálogo (actualización parcial)
 * - DELETE /admin/catalogs/:id - Eliminar elemento de catálogo
 */
@ApiTags('Catalogs')
@Controller('catalogs')
export class CatalogsController {
  constructor(
    private readonly getCatalogsHandler: GetCatalogsHandler,
    private readonly getCatalogHandler: GetCatalogHandler,
    private readonly createCatalogHandler: CreateCatalogHandler,
    private readonly updateCatalogHandler: UpdateCatalogHandler,
    private readonly deleteCatalogHandler: DeleteCatalogHandler,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener catálogos',
    description:
      'Obtiene la lista de elementos de catálogo. Permite filtrar por tipo (BUSINESS_CATEGORIES, REWARD_TYPES, PAYMENT_METHODS) y opcionalmente incluir elementos inactivos. Los resultados se ordenan por tipo, orden de visualización y valor.',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['BUSINESS_CATEGORIES', 'REWARD_TYPES', 'PAYMENT_METHODS'],
    description: 'Tipo de catálogo a filtrar (opcional)',
    example: 'BUSINESS_CATEGORIES',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Si se incluyen elementos inactivos en la respuesta',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de catálogos obtenida exitosamente',
    type: GetCatalogsResponse,
    example: {
      catalogs: [
        {
          id: 1,
          type: 'BUSINESS_CATEGORIES',
          value: 'Restaurante',
          slug: 'restaurant',
          displayOrder: 1,
          isActive: true,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
        {
          id: 2,
          type: 'BUSINESS_CATEGORIES',
          value: 'Retail / Tienda',
          slug: 'retail',
          displayOrder: 2,
          isActive: true,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
        {
          id: 10,
          type: 'REWARD_TYPES',
          value: 'Por monto de compra',
          slug: 'por-monto-compra',
          displayOrder: 1,
          isActive: true,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
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
      message: ['type must be one of the following values: BUSINESS_CATEGORIES, REWARD_TYPES, PAYMENT_METHODS'],
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
    type: InternalServerErrorResponseDto,
    example: {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    },
  })
  async getCatalogs(
    @Query('type') type?: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<GetCatalogsResponse> {
    const request = new GetCatalogsRequest();
    if (type) {
      request.type = type as 'BUSINESS_CATEGORIES' | 'REWARD_TYPES' | 'PAYMENT_METHODS';
    }
    request.includeInactive = includeInactive === 'true';
    return this.getCatalogsHandler.execute(request);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear un nuevo elemento de catálogo',
    description:
      'Crea un nuevo elemento de catálogo en el sistema. El tipo y valor deben ser únicos en combinación. No se permite duplicar elementos con el mismo tipo y valor.',
  })
  @ApiBody({
    type: CreateCatalogRequest,
    description: 'Datos del elemento de catálogo a crear',
    examples: {
      ejemplo1: {
        summary: 'Categoría básica',
        description: 'Ejemplo de creación de una categoría',
        value: {
          type: 'BUSINESS_CATEGORIES',
          value: 'Restaurante',
          slug: 'restaurant',
          displayOrder: 1,
          isActive: true,
        },
      },
      ejemplo2: {
        summary: 'Tipo de recompensa',
        description: 'Ejemplo de creación de un tipo de recompensa',
        value: {
          type: 'REWARD_TYPES',
          value: 'Por monto de compra',
          displayOrder: 1,
          isActive: true,
        },
      },
      ejemplo3: {
        summary: 'Método de pago',
        description: 'Ejemplo de creación de un método de pago',
        value: {
          type: 'PAYMENT_METHODS',
          value: 'Tarjeta de crédito',
          displayOrder: 1,
          isActive: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Elemento de catálogo creado exitosamente',
    type: CreateCatalogResponse,
    example: {
      id: 1,
      type: 'BUSINESS_CATEGORIES',
      value: 'Restaurante',
      slug: 'restaurant',
      displayOrder: 1,
      isActive: true,
      createdAt: '2024-01-15T10:30:00.000Z',
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
        'type must be one of the following values: BUSINESS_CATEGORIES, REWARD_TYPES, PAYMENT_METHODS',
        'value should not be empty',
        'value must be longer than or equal to 1 characters',
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
    description: 'No tiene permisos de administrador',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 409,
    description: 'El elemento de catálogo ya existe (tipo y valor duplicados)',
    example: {
      statusCode: 409,
      message: "Catalog item with type 'BUSINESS_CATEGORIES' and value 'Restaurante' already exists",
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
  async createCatalog(@Body() request: CreateCatalogRequest): Promise<CreateCatalogResponse> {
    return this.createCatalogHandler.execute(request);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener elemento de catálogo por ID',
    description: 'Obtiene la información completa de un elemento de catálogo por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del elemento de catálogo',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Elemento de catálogo encontrado',
    type: GetCatalogResponse,
    example: {
      id: 1,
      type: 'BUSINESS_CATEGORIES',
      value: 'Restaurante',
      slug: 'restaurant',
      displayOrder: 1,
      isActive: true,
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z',
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
    status: 404,
    description: 'Elemento de catálogo no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Catalog with ID 1 not found',
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
  async getCatalog(@Param('id', ParseIntPipe) id: number): Promise<GetCatalogResponse> {
    const request = new GetCatalogRequest();
    request.catalogId = id;
    return this.getCatalogHandler.execute(request);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar elemento de catálogo',
    description:
      'Actualiza un elemento de catálogo existente. Todos los campos son opcionales, solo se actualizarán los campos enviados (actualización parcial PATCH).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del elemento de catálogo a actualizar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiBody({
    type: UpdateCatalogRequest,
    description: 'Datos del elemento de catálogo a actualizar (todos los campos son opcionales)',
    examples: {
      ejemplo1: {
        summary: 'Actualizar solo el valor',
        description: 'Ejemplo de actualización parcial de solo el valor',
        value: {
          value: 'Restaurante Actualizado',
          slug: 'restaurant-actualizado',
        },
      },
      ejemplo2: {
        summary: 'Actualizar orden y estado',
        description: 'Ejemplo de actualización del orden de visualización y estado activo',
        value: {
          displayOrder: 5,
          isActive: false,
        },
      },
      ejemplo3: {
        summary: 'Activar elemento',
        description: 'Ejemplo de activación de un elemento inactivo',
        value: {
          isActive: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Elemento de catálogo actualizado exitosamente',
    type: UpdateCatalogResponse,
    example: {
      id: 1,
      type: 'CATEGORIES',
      value: 'Restaurante Actualizado',
      slug: 'restaurant-actualizado',
      displayOrder: 2,
      isActive: true,
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-20T14:45:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: [
        'value must be longer than or equal to 1 characters',
        'displayOrder must be a number conforming to the specified constraints',
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
    description: 'Elemento de catálogo no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Catalog with ID 1 not found',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto (valor duplicado para el mismo tipo)',
    example: {
      statusCode: 409,
      message: "Catalog item with type 'BUSINESS_CATEGORIES' and value 'Restaurante' already exists",
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
  async updateCatalog(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateCatalogRequest,
  ): Promise<UpdateCatalogResponse> {
    return this.updateCatalogHandler.execute(id, request);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Eliminar elemento de catálogo',
    description:
      'Elimina un elemento de catálogo del sistema. Esta acción es irreversible. Se recomienda desactivar el elemento en lugar de eliminarlo si se quiere mantener el historial.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del elemento de catálogo a eliminar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Elemento de catálogo eliminado exitosamente',
    type: DeleteCatalogResponse,
    example: {
      message: 'Catalog deleted successfully',
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
    description: 'Elemento de catálogo no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Catalog with ID 1 not found',
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
  async deleteCatalog(@Param('id', ParseIntPipe) id: number): Promise<DeleteCatalogResponse> {
    const request = new DeleteCatalogRequest();
    request.catalogId = id;
    return this.deleteCatalogHandler.execute(request);
  }
}


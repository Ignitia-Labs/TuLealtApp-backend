import {
  Controller,
  Get,
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
  ApiQuery,
} from '@nestjs/swagger';
import {
  GetCatalogsHandler,
  GetCatalogsRequest,
  GetCatalogsResponse,
  GetCatalogHandler,
  GetCatalogRequest,
  GetCatalogResponse,
} from '@libs/application';
import {
  BadRequestErrorResponseDto,
  NotFoundErrorResponseDto,
  InternalServerErrorResponseDto,
} from '@libs/shared';

/**
 * Controlador de catálogos para Partner API
 * Permite consultar los catálogos configurables del sistema (categorías, tipos de recompensas, métodos de pago)
 * Solo permite operaciones de lectura (GET)
 * Endpoints públicos - No requieren autenticación
 *
 * Endpoints:
 * - GET /partner/catalogs - Obtener todos los catálogos o filtrar por tipo
 * - GET /partner/catalogs/:id - Obtener elemento de catálogo por ID
 */
@ApiTags('Partner Catalogs')
@Controller('catalogs')
export class CatalogsController {
  constructor(
    private readonly getCatalogsHandler: GetCatalogsHandler,
    private readonly getCatalogHandler: GetCatalogHandler,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener catálogos',
    description:
      'Obtiene la lista de elementos de catálogo. Permite filtrar por tipo (BUSINESS_CATEGORIES, REWARD_TYPES, PAYMENT_METHODS) y opcionalmente incluir elementos inactivos. Los resultados se ordenan por tipo, orden de visualización y valor. Endpoint público - No requiere autenticación.',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['BUSINESS_CATEGORIES', 'REWARD_TYPES', 'PAYMENT_METHODS', 'PAYMENT_CATEGORIES'],
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
      message: [
        'type must be one of the following values: BUSINESS_CATEGORIES, REWARD_TYPES, PAYMENT_METHODS, PAYMENT_CATEGORIES',
      ],
      error: 'Bad Request',
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
      request.type = type as
        | 'BUSINESS_CATEGORIES'
        | 'REWARD_TYPES'
        | 'PAYMENT_METHODS'
        | 'PAYMENT_CATEGORIES';
    }
    request.includeInactive = includeInactive === 'true';
    return this.getCatalogsHandler.execute(request);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener elemento de catálogo por ID',
    description: 'Obtiene la información completa de un elemento de catálogo por su ID. Endpoint público - No requiere autenticación.',
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
}

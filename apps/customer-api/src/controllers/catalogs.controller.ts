import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import {
  GetCatalogsHandler,
  GetCatalogsRequest,
  GetCatalogsResponse,
} from '@libs/application';
import {
  BadRequestErrorResponseDto,
  InternalServerErrorResponseDto,
} from '@libs/shared';

/**
 * Controlador de catálogos para Customer API
 * Proporciona acceso público de solo lectura a los catálogos configurables del sistema
 * (categorías de negocio, tipos de recompensas, métodos de pago)
 *
 * Endpoints:
 * - GET /customer/catalogs - Obtener todos los catálogos activos o filtrar por tipo
 *
 * Características:
 * - No requiere autenticación (público)
 * - Solo lectura
 * - Solo retorna elementos activos por defecto
 */
@ApiTags('Catalogs')
@Controller('catalogs')
export class CatalogsController {
  constructor(private readonly getCatalogsHandler: GetCatalogsHandler) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener catálogos disponibles',
    description:
      'Obtiene la lista de catálogos activos del sistema. ' +
      'Permite filtrar por tipo (BUSINESS_CATEGORIES, REWARD_TYPES, LOYALTY_PROGRAM_TYPES, PAYMENT_METHODS, PAYMENT_CATEGORIES). ' +
      'Los resultados se ordenan por tipo, orden de visualización y valor. ' +
      'Este endpoint es público y no requiere autenticación.',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: [
      'BUSINESS_CATEGORIES',
      'REWARD_TYPES',
      'LOYALTY_PROGRAM_TYPES',
      'PAYMENT_METHODS',
      'PAYMENT_CATEGORIES',
    ],
    description: 'Tipo de catálogo a filtrar (opcional)',
    example: 'BUSINESS_CATEGORIES',
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
        'type must be one of the following values: BUSINESS_CATEGORIES, REWARD_TYPES, LOYALTY_PROGRAM_TYPES, PAYMENT_METHODS, PAYMENT_CATEGORIES',
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
  async getCatalogs(@Query('type') type?: string): Promise<GetCatalogsResponse> {
    const request = new GetCatalogsRequest();
    if (type) {
      request.type = type as
        | 'BUSINESS_CATEGORIES'
        | 'REWARD_TYPES'
        | 'LOYALTY_PROGRAM_TYPES'
        | 'PAYMENT_METHODS'
        | 'PAYMENT_CATEGORIES';
    }
    // Always return only active catalogs for customers (public endpoint)
    request.includeInactive = false;
    return this.getCatalogsHandler.execute(request);
  }
}

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CreateInvoiceHandler,
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  GetInvoiceHandler,
  GetInvoiceRequest,
  GetInvoiceResponse,
  GetInvoicesHandler,
  GetInvoicesRequest,
  GetInvoicesResponse,
} from '@libs/application';
import { JwtAuthGuard, RolesGuard, Roles } from '@libs/shared';

/**
 * Controlador de facturas para Admin API
 * Permite gestionar facturas de suscripciones
 *
 * Endpoints:
 * - GET /admin/invoices/:id - Obtener una factura por ID
 * - GET /admin/invoices?subscriptionId={id} - Obtener facturas de una suscripción
 * - GET /admin/invoices?partnerId={id} - Obtener facturas de un partner
 * - POST /admin/invoices - Crear una nueva factura
 */
@ApiTags('Invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly createInvoiceHandler: CreateInvoiceHandler,
    private readonly getInvoiceHandler: GetInvoiceHandler,
    private readonly getInvoicesHandler: GetInvoicesHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear una nueva factura',
    description:
      'Crea una nueva factura para una suscripción. La factura puede estar asociada a un ciclo de facturación. Se genera automáticamente un número de factura único con formato INV-{YEAR}-{SEQUENCE}.',
  })
  @ApiBody({
    type: CreateInvoiceRequest,
    description: 'Datos de la factura a crear',
    examples: {
      ejemplo1: {
        summary: 'Factura básica',
        description: 'Ejemplo de creación de factura con un item',
        value: {
          subscriptionId: 1,
          issueDate: '2024-02-01T00:00:00.000Z',
          dueDate: '2024-02-08T23:59:59.999Z',
          items: [
            {
              id: '1',
              description: 'Suscripción conecta - monthly',
              quantity: 1,
              unitPrice: 99.99,
              taxRate: 16.0,
            },
          ],
          currency: 'USD',
        },
      },
      ejemplo2: {
        summary: 'Factura con descuento y créditos',
        description: 'Ejemplo de creación de factura con descuento y créditos aplicados',
        value: {
          subscriptionId: 1,
          billingCycleId: 1,
          issueDate: '2024-02-01T00:00:00.000Z',
          dueDate: '2024-02-08T23:59:59.999Z',
          items: [
            {
              id: '1',
              description: 'Suscripción conecta - monthly',
              quantity: 1,
              unitPrice: 99.99,
              taxRate: 16.0,
              discountPercent: 10.0,
            },
          ],
          discountAmount: 10.0,
          creditApplied: 5.0,
          currency: 'USD',
          notes: 'Factura con descuento promocional',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Factura creada exitosamente',
    type: CreateInvoiceResponse,
    example: {
      id: 1,
      invoiceNumber: 'INV-2024-001',
      subscriptionId: 1,
      partnerId: 1,
      billingCycleId: 1,
      businessName: 'Café Delicia S.A.',
      taxId: '123456789',
      fiscalAddress: 'Av. Principal 123, Ciudad',
      billingEmail: 'billing@cafedelicia.com',
      issueDate: '2024-02-01T00:00:00.000Z',
      dueDate: '2024-02-08T23:59:59.999Z',
      paidDate: null,
      subtotal: 99.99,
      discountAmount: 10.0,
      taxAmount: 16.0,
      creditApplied: 5.0,
      total: 100.99,
      currency: 'USD',
      items: [
        {
          id: '1',
          description: 'Suscripción conecta - monthly',
          quantity: 1,
          unitPrice: 99.99,
          amount: 99.99,
          taxRate: 16.0,
          taxAmount: 16.0,
          discountPercent: 10.0,
          discountAmount: 10.0,
          total: 105.99,
        },
      ],
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: null,
      pdfUrl: null,
      notes: 'Factura generada automáticamente',
      createdAt: '2024-02-01T10:30:00.000Z',
      updatedAt: '2024-02-01T10:30:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    example: {
      statusCode: 400,
      message: [
        'Invoice must have at least one item',
        'Total amount cannot be negative after discounts and credits',
      ],
      error: 'Bad Request',
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
    description: 'No tiene permisos suficientes',
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Suscripción, ciclo de facturación o partner no encontrado',
    example: {
      statusCode: 404,
      message: 'Subscription with ID 1 not found',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error del servidor',
    example: {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    },
  })
  async createInvoice(
    @Body() request: CreateInvoiceRequest,
  ): Promise<CreateInvoiceResponse> {
    return this.createInvoiceHandler.execute(request);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener una factura por ID',
    description: 'Obtiene la información detallada de una factura específica por su ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la factura',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Factura encontrada',
    type: GetInvoiceResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Factura no encontrada',
    example: {
      statusCode: 404,
      message: 'Invoice with ID 1 not found',
      error: 'Not Found',
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
    description: 'No tiene permisos suficientes',
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  async getInvoice(@Param('id', ParseIntPipe) id: number): Promise<GetInvoiceResponse> {
    const request = new GetInvoiceRequest();
    request.invoiceId = id;
    return this.getInvoiceHandler.execute(request);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener múltiples facturas',
    description:
      'Obtiene una lista de facturas filtradas por suscripción o partner. Se debe proporcionar al menos uno de los filtros.',
  })
  @ApiQuery({
    name: 'subscriptionId',
    required: false,
    type: Number,
    description: 'ID de la suscripción para filtrar las facturas',
    example: 1,
  })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    type: Number,
    description: 'ID del partner para filtrar las facturas',
    example: 1,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página para paginación',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de elementos por página',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de facturas encontradas',
    type: GetInvoicesResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    example: {
      statusCode: 400,
      message: 'Either subscriptionId or partnerId must be provided',
      error: 'Bad Request',
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
    description: 'No tiene permisos suficientes',
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  async getInvoices(
    @Query('subscriptionId') subscriptionId?: number,
    @Query('partnerId') partnerId?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<GetInvoicesResponse> {
    const request = new GetInvoicesRequest();
    if (subscriptionId) {
      request.subscriptionId = Number(subscriptionId);
    }
    if (partnerId) {
      request.partnerId = Number(partnerId);
    }
    if (page) {
      request.page = Number(page);
    }
    if (limit) {
      request.limit = Number(limit);
    }
    return this.getInvoicesHandler.execute(request);
  }
}


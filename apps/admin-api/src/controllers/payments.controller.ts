import {
  Controller,
  Post,
  Get,
  Delete,
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
  CreatePaymentHandler,
  CreatePaymentRequest,
  CreatePaymentResponse,
  GetPaymentHandler,
  GetPaymentRequest,
  GetPaymentResponse,
  GetPaymentsHandler,
  GetPaymentsRequest,
  GetPaymentsResponse,
  DeletePaymentHandler,
  DeletePaymentRequest,
  DeletePaymentResponse,
} from '@libs/application';
import { JwtAuthGuard, RolesGuard, Roles } from '@libs/shared';

/**
 * Controlador de pagos para Admin API
 * Permite gestionar pagos de suscripciones, facturas y ciclos de facturación
 *
 * Endpoints:
 * - GET /admin/payments/:id - Obtener un pago por ID
 * - GET /admin/payments?subscriptionId={id} - Obtener pagos de una suscripción
 * - GET /admin/payments?partnerId={id} - Obtener pagos de un partner
 * - GET /admin/payments?invoiceId={id} - Obtener pagos de una factura
 * - POST /admin/payments - Registrar un nuevo pago
 */
@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly createPaymentHandler: CreatePaymentHandler,
    private readonly getPaymentHandler: GetPaymentHandler,
    private readonly getPaymentsHandler: GetPaymentsHandler,
    private readonly deletePaymentHandler: DeletePaymentHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Registrar un nuevo pago',
    description:
      'Registra un nuevo pago para una suscripción. El pago puede estar asociado a una factura y/o ciclo de facturación. Si el pago es exitoso, se actualizan automáticamente los estados de la factura y el ciclo de facturación.',
  })
  @ApiBody({
    type: CreatePaymentRequest,
    description: 'Datos del pago a registrar',
    examples: {
      ejemplo1: {
        summary: 'Pago con tarjeta de crédito',
        description: 'Ejemplo de registro de pago con tarjeta de crédito',
        value: {
          subscriptionId: 1,
          invoiceId: 1,
          billingCycleId: 1,
          amount: 99.99,
          currency: 'USD',
          paymentMethod: 'credit_card',
          status: 'paid',
          gateway: 'stripe',
          gatewayTransactionId: 'ch_1234567890',
          cardLastFour: '4242',
          cardBrand: 'Visa',
          cardExpiry: '12/25',
        },
      },
      ejemplo2: {
        summary: 'Pago con transferencia bancaria',
        description: 'Ejemplo de registro de pago con transferencia bancaria',
        value: {
          subscriptionId: 1,
          invoiceId: 1,
          amount: 99.99,
          currency: 'USD',
          paymentMethod: 'bank_transfer',
          status: 'pending',
          reference: 'REF-2024-001',
          notes: 'Pago pendiente de confirmación bancaria',
        },
      },
      ejemplo3: {
        summary: 'Pago en efectivo',
        description: 'Ejemplo de registro de pago en efectivo',
        value: {
          subscriptionId: 1,
          billingCycleId: 1,
          amount: 99.99,
          currency: 'USD',
          paymentMethod: 'cash',
          status: 'paid',
          confirmationCode: 'CASH-123456',
          notes: 'Pago recibido en sucursal',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Pago registrado exitosamente',
    type: CreatePaymentResponse,
    example: {
      id: 1,
      subscriptionId: 1,
      partnerId: 1,
      invoiceId: 1,
      billingCycleId: 1,
      amount: 99.99,
      currency: 'USD',
      paymentMethod: 'credit_card',
      status: 'paid',
      paymentDate: '2024-02-05T10:30:00.000Z',
      processedDate: '2024-02-05T10:30:05.000Z',
      transactionId: 123456789,
      reference: null,
      confirmationCode: null,
      gateway: 'stripe',
      gatewayTransactionId: 'ch_1234567890',
      cardLastFour: '4242',
      cardBrand: 'Visa',
      cardExpiry: '12/25',
      isRetry: false,
      retryAttempt: null,
      notes: 'Pago procesado exitosamente',
      processedBy: null,
      createdAt: '2024-02-05T10:30:00.000Z',
      updatedAt: '2024-02-05T10:30:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    example: {
      statusCode: 400,
      message: [
        'Payment amount 150.00 cannot exceed invoice total 99.99',
        'Invoice 1 does not belong to BillingCycle 2',
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
    description: 'Suscripción, factura o ciclo de facturación no encontrado',
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
  async createPayment(@Body() request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    return this.createPaymentHandler.execute(request);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener un pago por ID',
    description: 'Obtiene la información detallada de un pago específico por su ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del pago',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Pago encontrado',
    type: GetPaymentResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Pago no encontrado',
    example: {
      statusCode: 404,
      message: 'Payment with ID 1 not found',
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
  async getPayment(@Param('id', ParseIntPipe) id: number): Promise<GetPaymentResponse> {
    const request = new GetPaymentRequest();
    request.paymentId = id;
    return this.getPaymentHandler.execute(request);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener múltiples pagos',
    description:
      'Obtiene una lista de pagos filtrados por suscripción, partner o factura. Se debe proporcionar al menos uno de los filtros.',
  })
  @ApiQuery({
    name: 'subscriptionId',
    required: false,
    type: Number,
    description: 'ID de la suscripción para filtrar los pagos',
    example: 1,
  })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    type: Number,
    description: 'ID del partner para filtrar los pagos',
    example: 1,
  })
  @ApiQuery({
    name: 'invoiceId',
    required: false,
    type: Number,
    description: 'ID de la factura para filtrar los pagos',
    example: 1,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
    description: 'Estado del pago para filtrar (requiere partnerId)',
    example: 'paid',
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
  @ApiQuery({
    name: 'includeDerived',
    required: false,
    type: Boolean,
    description:
      'Incluir payments derivados en los resultados (por defecto false, solo muestra payments originales)',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pagos encontrados',
    type: GetPaymentsResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    example: {
      statusCode: 400,
      message: 'At least one filter (subscriptionId, partnerId, or invoiceId) must be provided',
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
  async getPayments(
    @Query('subscriptionId') subscriptionId?: number,
    @Query('partnerId') partnerId?: number,
    @Query('invoiceId') invoiceId?: number,
    @Query('status') status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('includeDerived') includeDerived?: string | boolean,
  ): Promise<GetPaymentsResponse> {
    const request = new GetPaymentsRequest();
    if (subscriptionId) {
      request.subscriptionId = Number(subscriptionId);
    }
    if (partnerId) {
      request.partnerId = Number(partnerId);
    }
    if (invoiceId) {
      request.invoiceId = Number(invoiceId);
    }
    if (status) {
      request.status = status;
    }
    if (page) {
      request.page = Number(page);
    }
    if (limit) {
      request.limit = Number(limit);
    }
    if (includeDerived !== undefined) {
      // Convertir string 'true' a boolean, o mantener boolean si ya lo es
      request.includeDerived =
        includeDerived === true || includeDerived === 'true' || includeDerived === '1';
    }
    return this.getPaymentsHandler.execute(request);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Eliminar un pago',
    description:
      'Elimina un pago del sistema. Esta acción es irreversible y solo está disponible para administradores. Al eliminar un pago, se revierte automáticamente su impacto en billing cycles e invoices asociados.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del pago a eliminar',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Pago eliminado exitosamente',
    type: DeletePaymentResponse,
    example: {
      id: 1,
      message: 'Payment deleted successfully',
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
    description: 'No tiene permisos de administrador',
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Pago no encontrado',
    example: {
      statusCode: 404,
      message: 'Payment with ID 1 not found',
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
  async deletePayment(@Param('id', ParseIntPipe) id: number): Promise<DeletePaymentResponse> {
    const request = new DeletePaymentRequest();
    request.paymentId = id;
    return this.deletePaymentHandler.execute(request);
  }
}

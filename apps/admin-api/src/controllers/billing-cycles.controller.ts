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
  CreateBillingCycleHandler,
  CreateBillingCycleRequest,
  CreateBillingCycleResponse,
  GetBillingCycleHandler,
  GetBillingCycleRequest,
  GetBillingCycleResponse,
  GetBillingCyclesHandler,
  GetBillingCyclesRequest,
  GetBillingCyclesResponse,
  BillingCycleGeneratorService,
} from '@libs/application';
import { JwtAuthGuard, RolesGuard, Roles } from '@libs/shared';

/**
 * Controlador de ciclos de facturación para Admin API
 * Permite gestionar ciclos de facturación de suscripciones
 *
 * Endpoints:
 * - GET /admin/billing-cycles/:id - Obtener un ciclo de facturación por ID
 * - GET /admin/billing-cycles?subscriptionId={id} - Obtener ciclos de una suscripción
 * - GET /admin/billing-cycles?partnerId={id} - Obtener ciclos pendientes de un partner
 * - POST /admin/billing-cycles - Crear un nuevo ciclo de facturación
 */
@ApiTags('Billing Cycles')
@Controller('billing-cycles')
export class BillingCyclesController {
  constructor(
    private readonly createBillingCycleHandler: CreateBillingCycleHandler,
    private readonly getBillingCycleHandler: GetBillingCycleHandler,
    private readonly getBillingCyclesHandler: GetBillingCyclesHandler,
    private readonly billingCycleGeneratorService: BillingCycleGeneratorService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear un nuevo ciclo de facturación',
    description:
      'Crea un nuevo ciclo de facturación para una suscripción. El ciclo representa un período de facturación específico.',
  })
  @ApiBody({
    type: CreateBillingCycleRequest,
    description: 'Datos del ciclo de facturación a crear',
    examples: {
      ejemplo1: {
        summary: 'Ciclo mensual básico',
        description: 'Ejemplo de creación de ciclo mensual sin descuentos',
        value: {
          subscriptionId: 1,
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-31T23:59:59.999Z',
          billingDate: '2024-02-01T00:00:00.000Z',
          dueDate: '2024-02-08T23:59:59.999Z',
          amount: 99.99,
          currency: 'USD',
        },
      },
      ejemplo2: {
        summary: 'Ciclo con descuento',
        description: 'Ejemplo de creación de ciclo con descuento aplicado',
        value: {
          subscriptionId: 1,
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-31T23:59:59.999Z',
          billingDate: '2024-02-01T00:00:00.000Z',
          dueDate: '2024-02-08T23:59:59.999Z',
          amount: 99.99,
          currency: 'USD',
          discountApplied: 10.0,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Ciclo de facturación creado exitosamente',
    type: CreateBillingCycleResponse,
    example: {
      id: 1,
      subscriptionId: 1,
      partnerId: 1,
      cycleNumber: 1,
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-01-31T23:59:59.999Z',
      durationDays: 31,
      billingDate: '2024-02-01T00:00:00.000Z',
      dueDate: '2024-02-08T23:59:59.999Z',
      amount: 99.99,
      paidAmount: 0,
      totalAmount: 89.99,
      currency: 'USD',
      status: 'pending',
      paymentStatus: 'pending',
      paymentDate: null,
      paymentMethod: null,
      invoiceId: null,
      invoiceNumber: null,
      invoiceStatus: null,
      discountApplied: 10.0,
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
        'startDate must be before endDate',
        'amount must be a positive number',
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
    description: 'Suscripción no encontrada',
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
  async createBillingCycle(
    @Body() request: CreateBillingCycleRequest,
  ): Promise<CreateBillingCycleResponse> {
    return this.createBillingCycleHandler.execute(request);
  }

  @Post('generate/:subscriptionId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generar ciclo de facturación automáticamente',
    description:
      'Genera automáticamente un ciclo de facturación y factura para una suscripción específica. Útil para testing o ejecución manual.',
  })
  @ApiParam({
    name: 'subscriptionId',
    description: 'ID de la suscripción para la cual generar el ciclo',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Ciclo de facturación generado exitosamente',
    example: {
      message: 'Billing cycle and invoice generated successfully for subscription 1',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error al generar el ciclo',
    example: {
      statusCode: 400,
      message: 'Error generating billing cycle',
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
    description: 'Suscripción no encontrada',
    example: {
      statusCode: 404,
      message: 'Subscription with ID 1 not found',
      error: 'Not Found',
    },
  })
  async generateBillingCycle(
    @Param('subscriptionId', ParseIntPipe) subscriptionId: number,
  ): Promise<{ message: string }> {
    await this.billingCycleGeneratorService.generateBillingCycleManually(subscriptionId);
    return {
      message: `Billing cycle and invoice generated successfully for subscription ${subscriptionId}`,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener un ciclo de facturación por ID',
    description: 'Obtiene la información detallada de un ciclo de facturación específico.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del ciclo de facturación',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Ciclo de facturación encontrado',
    type: GetBillingCycleResponse,
    example: {
      id: 1,
      subscriptionId: 1,
      partnerId: 1,
      cycleNumber: 1,
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-01-31T23:59:59.999Z',
      durationDays: 31,
      billingDate: '2024-02-01T00:00:00.000Z',
      dueDate: '2024-02-08T23:59:59.999Z',
      amount: 99.99,
      paidAmount: 0,
      totalAmount: 89.99,
      currency: 'USD',
      status: 'pending',
      paymentStatus: 'pending',
      paymentDate: null,
      paymentMethod: null,
      invoiceId: null,
      invoiceNumber: null,
      invoiceStatus: null,
      discountApplied: 10.0,
      createdAt: '2024-02-01T10:30:00.000Z',
      updatedAt: '2024-02-01T10:30:00.000Z',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Ciclo de facturación no encontrado',
    example: {
      statusCode: 404,
      message: 'Billing cycle with ID 1 not found',
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
  async getBillingCycle(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GetBillingCycleResponse> {
    const request = new GetBillingCycleRequest();
    request.billingCycleId = id;
    return this.getBillingCycleHandler.execute(request);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener múltiples ciclos de facturación',
    description:
      'Obtiene una lista de ciclos de facturación filtrados por suscripción o partner. Se debe proporcionar al menos uno de los filtros.',
  })
  @ApiQuery({
    name: 'subscriptionId',
    required: false,
    type: Number,
    description: 'ID de la suscripción para filtrar los ciclos',
    example: 1,
  })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    type: Number,
    description: 'ID del partner para filtrar los ciclos pendientes',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de ciclos de facturación encontrados',
    type: GetBillingCyclesResponse,
    example: {
      billingCycles: [
        {
          id: 1,
          subscriptionId: 1,
          partnerId: 1,
          cycleNumber: 1,
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-31T23:59:59.999Z',
          durationDays: 31,
          billingDate: '2024-02-01T00:00:00.000Z',
          dueDate: '2024-02-08T23:59:59.999Z',
          amount: 99.99,
          paidAmount: 0,
          totalAmount: 89.99,
          currency: 'USD',
          status: 'pending',
          paymentStatus: 'pending',
          paymentDate: null,
          paymentMethod: null,
          invoiceId: null,
          invoiceNumber: null,
          invoiceStatus: null,
          discountApplied: 10.0,
          createdAt: '2024-02-01T10:30:00.000Z',
          updatedAt: '2024-02-01T10:30:00.000Z',
        },
      ],
      total: 1,
    },
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
  async getBillingCycles(
    @Query('subscriptionId') subscriptionId?: number,
    @Query('partnerId') partnerId?: number,
  ): Promise<GetBillingCyclesResponse> {
    const request = new GetBillingCyclesRequest();
    if (subscriptionId) {
      request.subscriptionId = Number(subscriptionId);
    }
    if (partnerId) {
      request.partnerId = Number(partnerId);
    }
    return this.getBillingCyclesHandler.execute(request);
  }

  @Post('generate/:subscriptionId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generar ciclo de facturación manualmente',
    description:
      'Genera un ciclo de facturación y factura para una suscripción específica. Útil para testing, corrección de errores o facturación anticipada. Este endpoint ejecuta la misma lógica que el cron job automático pero para una suscripción específica.',
  })
  @ApiParam({
    name: 'subscriptionId',
    description: 'ID de la suscripción para la cual generar el ciclo',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Ciclo de facturación generado exitosamente',
    example: {
      message: 'Ciclo de facturación generado exitosamente para suscripción 1',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Suscripción no encontrada',
    example: {
      statusCode: 404,
      message: 'Subscription with ID 1 not found',
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
    description: 'No tiene permisos de administrador',
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  async generateBillingCycleManually(
    @Param('subscriptionId', ParseIntPipe) subscriptionId: number,
  ): Promise<{ message: string }> {
    await this.billingCycleGeneratorService.generateBillingCycleManually(subscriptionId);
    return {
      message: `Ciclo de facturación generado exitosamente para suscripción ${subscriptionId}`,
    };
  }

  @Post('generate-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Ejecutar generación automática de ciclos manualmente',
    description:
      'Ejecuta manualmente el proceso de generación automática de ciclos de facturación. Este es el mismo proceso que ejecuta el cron job diariamente a las 2:00 AM. Útil para testing o para ejecutar fuera del horario programado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Proceso de generación ejecutado exitosamente',
    example: {
      message: 'Proceso de generación automática de ciclos ejecutado exitosamente',
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
  async generateAllBillingCyclesManually(): Promise<{ message: string }> {
    await this.billingCycleGeneratorService.handleDailyBillingCycleGeneration();
    return {
      message: 'Proceso de generación automática de ciclos ejecutado exitosamente',
    };
  }
}


import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  BadRequestException,
  Inject,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  GetCurrentBillingCycleHandler,
  GetCurrentBillingCycleRequest,
  GetCurrentBillingCycleResponse,
  GetPartnerPaymentsHandler,
  GetPartnerPaymentsRequest,
  GetPartnerPaymentsResponse,
  GetPartnerInvoicesHandler,
  GetPartnerInvoicesRequest,
  GetPartnerInvoicesResponse,
  GetPartnerSubscriptionHandler,
  GetPartnerSubscriptionRequest,
  GetPartnerSubscriptionResponse,
  CreatePaymentHandler,
  CreatePaymentRequest,
  CreatePaymentResponse,
  JwtPayload,
} from '@libs/application';
import { IUserRepository } from '@libs/domain';
import { PartnerSubscriptionEntity, S3Service, ImageOptimizerService } from '@libs/infrastructure';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  CurrentUser,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  BadRequestErrorResponseDto,
  isBase64Image,
  validateBase64Image,
} from '@libs/shared';

/**
 * Controlador de facturación para Partner API
 * Permite a los partners autenticados consultar información sobre su suscripción,
 * ciclo de facturación actual, historial de pagos e historial de facturas
 *
 * Endpoints:
 * - GET /partner/billing/current-cycle - Obtener ciclo de facturación actual
 * - GET /partner/billing/payments - Obtener historial de pagos
 * - POST /partner/billing/payments - Registrar un nuevo pago
 * - GET /partner/billing/invoices - Obtener historial de facturas
 * - GET /partner/billing/subscription - Obtener información de la suscripción
 */
@ApiTags('Partner Billing')
@Controller('billing')
export class PartnerBillingController {
  constructor(
    private readonly getCurrentBillingCycleHandler: GetCurrentBillingCycleHandler,
    private readonly getPartnerPaymentsHandler: GetPartnerPaymentsHandler,
    private readonly getPartnerInvoicesHandler: GetPartnerInvoicesHandler,
    private readonly getPartnerSubscriptionHandler: GetPartnerSubscriptionHandler,
    private readonly createPaymentHandler: CreatePaymentHandler,
    private readonly s3Service: S3Service,
    private readonly imageOptimizerService: ImageOptimizerService,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
  ) {}

  private async uploadBase64Image(base64Value: string): Promise<string> {
    const { buffer, mimetype } = validateBase64Image(base64Value);
    const fileLike = {
      fieldname: 'image',
      originalname: `image.${mimetype.split('/')[1]}`,
      encoding: '7bit',
      mimetype,
      size: buffer.length,
      buffer,
    };
    try {
      const optimized = await this.imageOptimizerService.optimize(fileLike);
      return await this.s3Service.uploadFile(optimized, 'payments');
    } catch (error) {
      throw new BadRequestException(`Failed to upload image: ${(error as Error).message}`);
    }
  }

  @Get('current-cycle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARTNER', 'PARTNER_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener ciclo de facturación actual',
    description:
      'Obtiene el ciclo de facturación actual del partner autenticado. El ciclo actual es el más reciente que está dentro del período actual o tiene estado pendiente/vencido.',
  })
  @ApiResponse({
    status: 200,
    description: 'Ciclo de facturación actual obtenido exitosamente',
    type: GetCurrentBillingCycleResponse,
    example: {
      id: 5,
      subscriptionId: 1,
      partnerId: 1,
      cycleNumber: 5,
      startDate: '2024-02-01T00:00:00.000Z',
      endDate: '2024-02-29T23:59:59.999Z',
      durationDays: 29,
      billingDate: '2024-03-01T00:00:00.000Z',
      dueDate: '2024-03-08T23:59:59.999Z',
      amount: 99.99,
      paidAmount: 0,
      totalAmount: 89.99,
      currency: 'USD',
      currencyId: 1,
      currencyLabel: 'US Dollar',
      status: 'pending',
      paymentStatus: 'pending',
      invoiceNumber: 'INV-2024-005',
      daysUntilDue: 7,
      isOverdue: false,
      discountApplied: 10.0,
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos de partner o no pertenece a un partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontró ciclo de facturación actual',
    type: NotFoundErrorResponseDto,
  })
  async getCurrentBillingCycle(
    @CurrentUser() user: JwtPayload,
  ): Promise<GetCurrentBillingCycleResponse> {
    // Obtener partnerId del usuario autenticado
    const userEntity = await this.userRepository.findById(user.userId);
    if (!userEntity || !userEntity.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    const request = new GetCurrentBillingCycleRequest();
    request.partnerId = userEntity.partnerId;

    return this.getCurrentBillingCycleHandler.execute(request);
  }

  @Get('payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARTNER', 'PARTNER_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener historial de pagos',
    description:
      'Obtiene el historial de pagos del partner autenticado. Soporta paginación y filtros por estado. Use all=true para obtener todos los registros sin paginación (máximo 1000).',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
    description: 'Filtrar por estado del pago',
    example: 'paid',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (ignorado si all=true)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Registros por página, máximo 100 (ignorado si all=true)',
    example: 10,
  })
  @ApiQuery({
    name: 'all',
    required: false,
    type: Boolean,
    description:
      'Si es true, retorna todos los registros sin paginación. Límite máximo: 1000 registros.',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de pagos obtenido exitosamente',
    type: GetPartnerPaymentsResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Demasiados registros para retornar sin paginación',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: 'Too many records (1523). Please use pagination with limit max 100',
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos de partner o no pertenece a un partner',
    type: ForbiddenErrorResponseDto,
  })
  async getPaymentsHistory(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled',
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('all', new ParseBoolPipe({ optional: true })) all?: boolean,
  ): Promise<GetPartnerPaymentsResponse> {
    // Obtener partnerId del usuario autenticado
    const userEntity = await this.userRepository.findById(user.userId);
    if (!userEntity || !userEntity.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    const request = new GetPartnerPaymentsRequest();
    request.partnerId = userEntity.partnerId;
    request.status = status;
    request.page = page;
    request.limit = limit;
    request.all = all;

    return this.getPartnerPaymentsHandler.execute(request);
  }

  @Post('payments')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARTNER', 'PARTNER_STAFF')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Registrar un nuevo pago',
    description:
      'Registra un nuevo pago para la suscripción del partner autenticado. El pago queda en estado pending_validation hasta que un administrador lo confirme.',
  })
  @ApiBody({
    type: CreatePaymentRequest,
    description: 'Datos del pago a registrar',
    examples: {
      transferencia: {
        summary: 'Pago con transferencia bancaria',
        value: {
          subscriptionId: 1,
          invoiceId: 1,
          amount: 99.99,
          currency: 'USD',
          paymentMethod: 'bank_transfer',
          reference: 'REF-2024-001',
          notes: 'Transferencia enviada',
        },
      },
      efectivo: {
        summary: 'Pago en efectivo',
        value: {
          subscriptionId: 1,
          billingCycleId: 1,
          amount: 99.99,
          currency: 'USD',
          paymentMethod: 'cash',
          confirmationCode: 'CASH-123456',
          image: 'data:image/png;base64,iVBORw0KGgo...',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Pago registrado exitosamente en estado pending_validation',
    type: CreatePaymentResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o la suscripción no pertenece al partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Suscripción, factura o ciclo de facturación no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async createPayment(
    @CurrentUser() user: JwtPayload,
    @Body() request: CreatePaymentRequest,
  ): Promise<CreatePaymentResponse> {
    const userEntity = await this.userRepository.findById(user.userId);
    if (!userEntity || !userEntity.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { id: request.subscriptionId },
    });
    if (!subscription) {
      throw new ForbiddenException(
        `Subscription ${request.subscriptionId} not found or does not belong to your partner account`,
      );
    }
    if (subscription.partnerId !== userEntity.partnerId) {
      throw new ForbiddenException(
        `Subscription ${request.subscriptionId} does not belong to your partner account`,
      );
    }

    // Partners can only submit payments for validation; status is always forced
    request.status = 'pending_validation';

    if (request.image && isBase64Image(request.image)) {
      request.image = await this.uploadBase64Image(request.image);
    }

    return this.createPaymentHandler.execute(request);
  }

  @Get('invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARTNER', 'PARTNER_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener historial de facturas',
    description:
      'Obtiene el historial de facturas del partner autenticado. Soporta paginación y filtros por estado. Use all=true para obtener todos los registros sin paginación (máximo 1000).',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
    description: 'Filtrar por estado de la factura',
    example: 'paid',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (ignorado si all=true)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Registros por página, máximo 100 (ignorado si all=true)',
    example: 10,
  })
  @ApiQuery({
    name: 'all',
    required: false,
    type: Boolean,
    description:
      'Si es true, retorna todos los registros sin paginación. Límite máximo: 1000 registros.',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de facturas obtenido exitosamente',
    type: GetPartnerInvoicesResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Demasiados registros para retornar sin paginación',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: 'Too many records (1523). Please use pagination with limit max 100',
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos de partner o no pertenece a un partner',
    type: ForbiddenErrorResponseDto,
  })
  async getInvoicesHistory(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: 'pending' | 'paid' | 'overdue' | 'cancelled',
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('all', new ParseBoolPipe({ optional: true })) all?: boolean,
  ): Promise<GetPartnerInvoicesResponse> {
    // Obtener partnerId del usuario autenticado
    const userEntity = await this.userRepository.findById(user.userId);
    if (!userEntity || !userEntity.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    const request = new GetPartnerInvoicesRequest();
    request.partnerId = userEntity.partnerId;
    request.status = status;
    request.page = page;
    request.limit = limit;
    request.all = all;

    return this.getPartnerInvoicesHandler.execute(request);
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARTNER', 'PARTNER_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener información de la suscripción',
    description:
      'Obtiene la información completa de la suscripción del partner autenticado, incluyendo plan, estado, facturación, créditos y fechas importantes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Información de la suscripción obtenida exitosamente',
    type: GetPartnerSubscriptionResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos de partner o no pertenece a un partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Suscripción no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async getSubscription(@CurrentUser() user: JwtPayload): Promise<GetPartnerSubscriptionResponse> {
    // Obtener partnerId del usuario autenticado
    const userEntity = await this.userRepository.findById(user.userId);
    if (!userEntity || !userEntity.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    const request = new GetPartnerSubscriptionRequest();
    request.partnerId = userEntity.partnerId;

    return this.getPartnerSubscriptionHandler.execute(request);
  }
}

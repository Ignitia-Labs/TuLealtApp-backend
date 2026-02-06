import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
  ArrayMinSize,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ProcessLoyaltyEventHandler,
  ProcessLoyaltyEventResult,
  JwtPayload,
} from '@libs/application';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  CurrentUser,
  BadRequestErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
} from '@libs/shared';
import { LoyaltyEvent } from '@libs/domain';

/**
 * DTO de respuesta para evento de lealtad procesado
 */
class ProcessLoyaltyEventResponseDto {
  eventId: string;
  membershipId: number;
  programsProcessed: number[];
  transactionsCreated: number[];
  totalPointsAwarded: number;
  evaluations: any[];
  skipped: Array<{
    reason: string;
    ruleId?: number;
    programId?: number;
  }>;
  warnings?: string[];
}

/**
 * DTO para referencia de membresía
 */
class MembershipRefDto {
  @ApiPropertyOptional({
    description: 'ID de la membresía',
    example: 100,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  membershipId?: number | null;

  @ApiPropertyOptional({
    description: 'ID del cliente',
    example: 50,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  customerId?: number | null;

  @ApiPropertyOptional({
    description: 'ID del tenant',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  tenantId?: number | null;

  @ApiPropertyOptional({
    description: 'Código QR de la membresía',
    example: 'QR-USER-3-TENANT-1-5SO3IT',
    type: String,
  })
  @IsString()
  @IsOptional()
  qrCode?: string | null;
}

/**
 * DTO para item de compra
 */
class PurchaseItemDto {
  @ApiProperty({
    description: 'SKU del producto',
    example: 'PROD-001',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({
    description: 'Cantidad del producto',
    example: 2,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  qty: number;

  @ApiProperty({
    description: 'Precio unitario',
    example: 75.0,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({
    description: 'ID de la categoría',
    example: 5,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  categoryId?: number | null;

  @ApiPropertyOptional({
    description: 'Nombre de la categoría',
    example: 'Electrónica',
    type: String,
  })
  @IsString()
  @IsOptional()
  categoryName?: string | null;

  @ApiPropertyOptional({
    description: 'Nombre del producto',
    example: 'Producto Ejemplo',
    type: String,
  })
  @IsString()
  @IsOptional()
  productName?: string | null;
}

/**
 * DTO para procesar evento de compra
 */
class ProcessPurchaseEventRequest {
  @ApiProperty({
    description: 'ID del tenant',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  tenantId: number;

  @ApiProperty({
    description: 'ID único de la orden (sourceEventId)',
    example: 'FAC-00124',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  orderId: string; // sourceEventId

  @ApiProperty({
    description: 'Fecha y hora en que ocurrió el evento',
    example: '2026-01-31T02:57:22.591Z',
    type: Date,
  })
  @IsDateString()
  @IsNotEmpty()
  occurredAt: Date;

  @ApiProperty({
    description: 'Referencia a la membresía del cliente',
    type: MembershipRefDto,
  })
  @ValidateNested()
  @Type(() => MembershipRefDto)
  @IsNotEmpty()
  membershipRef: MembershipRefDto;

  @ApiProperty({
    description: 'Monto neto (sin impuestos/envío)',
    example: 100.0,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  netAmount: number;

  @ApiProperty({
    description: 'Monto bruto (con impuestos/envío)',
    example: 100.0,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  grossAmount: number;

  @ApiProperty({
    description: 'Código de moneda (ISO 4217)',
    example: 'GTQ',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiPropertyOptional({
    description:
      'Items de la compra (opcional - requerido solo para reglas con alcance de categoría/SKU)',
    type: [PurchaseItemDto],
    default: [],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  @IsOptional()
  items?: PurchaseItemDto[];

  @ApiPropertyOptional({
    description: 'Método de pago',
    example: 'cash',
    type: String,
  })
  @IsString()
  @IsOptional()
  paymentMethod?: string | null;

  @ApiPropertyOptional({
    description: 'Estado del pago',
    example: 'PAID',
    enum: ['PAID', 'PENDING', 'REFUNDED', 'CANCELLED'],
  })
  @IsEnum(['PAID', 'PENDING', 'REFUNDED', 'CANCELLED'])
  @IsOptional()
  paymentStatus?: 'PAID' | 'PENDING' | 'REFUNDED' | 'CANCELLED' | null;

  @ApiPropertyOptional({
    description: 'ID de la tienda',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  storeId?: number | null;

  @ApiPropertyOptional({
    description: 'ID de la sucursal',
    example: 2,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  branchId?: number | null;

  @ApiPropertyOptional({
    description: 'Canal de venta',
    example: 'in-store',
    type: String,
  })
  @IsString()
  @IsOptional()
  channel?: string | null;

  @ApiPropertyOptional({
    description: 'ID de correlación para trazabilidad',
    example: 'FAC-00124',
    type: String,
  })
  @IsString()
  @IsOptional()
  correlationId?: string | null;

  @ApiPropertyOptional({
    description: 'Metadatos adicionales',
    example: { cashierId: 2, transactionReference: 'FAC-00124' },
    type: Object,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any> | null;
}

/**
 * DTO para procesar evento de visita
 */
class ProcessVisitEventRequest {
  @ApiProperty({
    description: 'ID del tenant',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  tenantId: number;

  @ApiProperty({
    description: 'ID único de la visita (sourceEventId)',
    example: 'VISIT-2025-01-29-001',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  visitId: string; // sourceEventId

  @ApiProperty({
    description: 'Fecha y hora en que ocurrió el evento',
    example: '2025-01-29T10:00:00Z',
    type: Date,
  })
  @IsDateString()
  @IsNotEmpty()
  occurredAt: Date;

  @ApiProperty({
    description: 'Referencia a la membresía del cliente',
    type: MembershipRefDto,
  })
  @ValidateNested()
  @Type(() => MembershipRefDto)
  @IsNotEmpty()
  membershipRef: MembershipRefDto;

  @ApiPropertyOptional({
    description: 'ID de la tienda',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  storeId?: number | null;

  @ApiPropertyOptional({
    description: 'ID de la sucursal',
    example: 2,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  branchId?: number | null;

  @ApiPropertyOptional({
    description: 'Canal de visita',
    example: 'in-store',
    type: String,
  })
  @IsString()
  @IsOptional()
  channel?: string | null;

  @ApiPropertyOptional({
    description: 'Tipo de visita',
    example: 'walk-in',
    type: String,
  })
  @IsString()
  @IsOptional()
  visitType?: string | null;

  @ApiPropertyOptional({
    description: 'Duración de la visita en minutos',
    example: 30,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  durationMinutes?: number | null;

  @ApiPropertyOptional({
    description: 'ID de correlación para trazabilidad',
    example: 'CORR-001',
    type: String,
  })
  @IsString()
  @IsOptional()
  correlationId?: string | null;

  @ApiPropertyOptional({
    description: 'Metadatos adicionales',
    example: { reason: 'consultation' },
    type: Object,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any> | null;
}

/**
 * DTO para procesar evento personalizado
 */
class ProcessCustomEventRequest {
  @ApiProperty({
    description: 'ID del tenant',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  tenantId: number;

  @ApiProperty({
    description: 'ID único del evento (sourceEventId)',
    example: 'EVENT-2025-01-29-001',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  eventId: string; // sourceEventId

  @ApiProperty({
    description: 'Tipo de evento personalizado (ej: "BIRTHDAY", "ANNIVERSARY")',
    example: 'BIRTHDAY',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  eventType: string; // Tipo personalizado (ej: "BIRTHDAY", "ANNIVERSARY")

  @ApiProperty({
    description: 'Fecha y hora en que ocurrió el evento',
    example: '2025-01-29T10:00:00Z',
    type: Date,
  })
  @IsDateString()
  @IsNotEmpty()
  occurredAt: Date;

  @ApiProperty({
    description: 'Referencia a la membresía del cliente',
    type: MembershipRefDto,
  })
  @ValidateNested()
  @Type(() => MembershipRefDto)
  @IsNotEmpty()
  membershipRef: MembershipRefDto;

  @ApiPropertyOptional({
    description: 'Monto opcional para eventos con valor',
    example: 50.0,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number | null; // Monto opcional para eventos con valor

  @ApiPropertyOptional({
    description: 'Código de moneda (ISO 4217)',
    example: 'GTQ',
    type: String,
  })
  @IsString()
  @IsOptional()
  currency?: string | null;

  @ApiPropertyOptional({
    description: 'ID de la tienda',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  storeId?: number | null;

  @ApiPropertyOptional({
    description: 'ID de la sucursal',
    example: 2,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  branchId?: number | null;

  @ApiPropertyOptional({
    description: 'Canal del evento',
    example: 'mobile',
    type: String,
  })
  @IsString()
  @IsOptional()
  channel?: string | null;

  @ApiPropertyOptional({
    description: 'ID de correlación para trazabilidad',
    example: 'CORR-001',
    type: String,
  })
  @IsString()
  @IsOptional()
  correlationId?: string | null;

  @ApiPropertyOptional({
    description: 'Metadatos adicionales',
    example: { celebrationType: 'birthday' },
    type: Object,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any> | null;
}

/**
 * Controlador de eventos de lealtad para Partner API
 * Permite procesar eventos de lealtad (visitas, compras, eventos personalizados, etc.)
 *
 * Endpoints:
 * - POST /partner/loyalty/events/purchase - Procesar evento de compra
 * - POST /partner/loyalty/events/visit - Procesar evento de visita
 * - POST /partner/loyalty/events/custom - Procesar evento personalizado
 */
@ApiTags('Loyalty Events')
@Controller('loyalty/events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PARTNER', 'PARTNER_STAFF')
@ApiBearerAuth()
export class LoyaltyEventsController {
  constructor(private readonly processLoyaltyEventHandler: ProcessLoyaltyEventHandler) {}

  @Post('purchase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Procesar evento de compra',
    description:
      'Procesa un evento de compra y otorga puntos según las reglas de recompensa activas. ' +
      'El evento debe tener un orderId único (sourceEventId) para garantizar idempotencia.',
  })
  @ApiBody({
    description: 'Datos del evento de compra',
    type: ProcessPurchaseEventRequest,
    examples: {
      compraBasica: {
        summary: 'Compra básica',
        description: 'Ejemplo de evento de compra sin especificar sucursal',
        value: {
          tenantId: 1,
          orderId: 'FAC-00124',
          occurredAt: '2026-01-31T02:57:22.591Z',
          membershipRef: {
            membershipId: 100,
          },
          netAmount: 100.0,
          grossAmount: 100.0,
          currency: 'GTQ',
          paymentMethod: 'cash',
          paymentStatus: 'PAID',
        },
      },
      compraConBranch: {
        summary: 'Compra con sucursal',
        description: 'Ejemplo de evento de compra registrando la sucursal',
        value: {
          tenantId: 1,
          orderId: 'FAC-00125',
          occurredAt: '2026-01-31T02:57:22.591Z',
          membershipRef: {
            membershipId: 100,
          },
          netAmount: 150.0,
          grossAmount: 165.0,
          currency: 'GTQ',
          branchId: 2,
          paymentMethod: 'card',
          paymentStatus: 'PAID',
          channel: 'in-store',
        },
      },
      compraConItems: {
        summary: 'Compra con items y sucursal',
        description: 'Ejemplo de compra con items detallados y sucursal',
        value: {
          tenantId: 1,
          orderId: 'FAC-00126',
          occurredAt: '2026-01-31T02:57:22.591Z',
          membershipRef: {
            qrCode: 'QR-USER-3-TENANT-1-5SO3IT',
          },
          netAmount: 225.0,
          grossAmount: 247.5,
          currency: 'GTQ',
          branchId: 3,
          items: [
            {
              sku: 'PROD-001',
              qty: 2,
              unitPrice: 75.0,
              categoryId: 5,
              categoryName: 'Electrónica',
              productName: 'Producto Ejemplo',
            },
            {
              sku: 'PROD-002',
              qty: 1,
              unitPrice: 75.0,
              categoryId: 3,
              categoryName: 'Hogar',
            },
          ],
          paymentMethod: 'card',
          paymentStatus: 'PAID',
          channel: 'in-store',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Evento procesado exitosamente',
    type: ProcessLoyaltyEventResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No autorizado',
    type: ForbiddenErrorResponseDto,
  })
  async processPurchaseEvent(
    @Body() request: ProcessPurchaseEventRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProcessLoyaltyEventResult> {
    // Validaciones básicas
    if (!request.orderId || request.orderId.trim() === '') {
      throw new BadRequestException('orderId is required');
    }
    if (!request.tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    if (!request.membershipRef) {
      throw new BadRequestException('membershipRef is required');
    }
    // Items es opcional - se inicializa como array vacío si no se proporciona
    // Las reglas BASE_PURCHASE no requieren items, solo las reglas BONUS_CATEGORY/BONUS_SKU

    // Construir evento de lealtad
    const loyaltyEvent: Partial<LoyaltyEvent> = {
      tenantId: request.tenantId,
      eventType: 'PURCHASE',
      sourceEventId: request.orderId.trim(),
      occurredAt: request.occurredAt ? new Date(request.occurredAt) : new Date(),
      membershipRef: request.membershipRef,
      payload: {
        orderId: request.orderId.trim(),
        netAmount: request.netAmount,
        grossAmount: request.grossAmount,
        currency: request.currency,
        items: request.items || [], // Inicializar como array vacío si no se proporciona
        paymentMethod: request.paymentMethod || null,
        paymentStatus: request.paymentStatus || null,
        storeId: request.storeId || null,
        branchId: request.branchId || null,
        channel: request.channel || null,
        metadata: request.metadata || null,
      },
      correlationId: request.correlationId || null,
      createdBy: user.email || 'SYSTEM',
      metadata: request.metadata || null,
    };

    // Procesar evento
    return await this.processLoyaltyEventHandler.execute(loyaltyEvent);
  }

  @Post('visit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Procesar evento de visita',
    description:
      'Procesa un evento de visita a tienda y otorga puntos según las reglas de recompensa activas. ' +
      'El evento debe tener un visitId único (sourceEventId) para garantizar idempotencia.',
  })
  @ApiBody({
    description: 'Datos del evento de visita',
    type: ProcessVisitEventRequest,
    examples: {
      visitaBasica: {
        summary: 'Visita básica',
        description: 'Ejemplo de evento de visita sin especificar sucursal',
        value: {
          tenantId: 1,
          visitId: 'VISIT-2025-01-29-001',
          occurredAt: '2025-01-29T10:00:00Z',
          membershipRef: {
            membershipId: 100,
          },
        },
      },
      visitaConBranch: {
        summary: 'Visita con sucursal',
        description: 'Ejemplo de evento de visita registrando la sucursal',
        value: {
          tenantId: 1,
          visitId: 'VISIT-2025-01-29-002',
          occurredAt: '2025-01-29T10:00:00Z',
          membershipRef: {
            qrCode: 'QR-USER-3-TENANT-1-5SO3IT',
          },
          branchId: 2,
          channel: 'in-store',
          visitType: 'checkin',
        },
      },
      visitaDetallada: {
        summary: 'Visita detallada con sucursal',
        description: 'Ejemplo de visita con información completa',
        value: {
          tenantId: 1,
          visitId: 'VISIT-2025-01-29-003',
          occurredAt: '2025-01-29T10:00:00Z',
          membershipRef: {
            customerId: 50,
            tenantId: 1,
          },
          branchId: 3,
          channel: 'in-store',
          visitType: 'consultation',
          durationMinutes: 45,
          metadata: {
            consultantId: 10,
            serviceType: 'premium',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Evento procesado exitosamente',
    type: ProcessLoyaltyEventResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No autorizado',
    type: ForbiddenErrorResponseDto,
  })
  async processVisitEvent(
    @Body() request: ProcessVisitEventRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProcessLoyaltyEventResult> {
    // Validaciones básicas
    if (!request.visitId || request.visitId.trim() === '') {
      throw new BadRequestException('visitId is required');
    }
    if (!request.tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    if (!request.membershipRef) {
      throw new BadRequestException('membershipRef is required');
    }

    // Construir evento de lealtad
    const loyaltyEvent: Partial<LoyaltyEvent> = {
      eventType: 'VISIT',
      sourceEventId: request.visitId,
      tenantId: request.tenantId,
      membershipRef: request.membershipRef,
      occurredAt: request.occurredAt ? new Date(request.occurredAt) : new Date(),
      payload: {
        storeId: request.storeId || null,
        branchId: request.branchId || null,
        channel: request.channel || null,
        visitType: request.visitType || null,
        durationMinutes: request.durationMinutes || null,
      },
      correlationId: request.correlationId || null,
      createdBy: user.email || 'SYSTEM',
      metadata: request.metadata || null,
    };

    // Procesar evento
    return await this.processLoyaltyEventHandler.execute(loyaltyEvent);
  }

  @Post('custom')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Procesar evento personalizado',
    description:
      'Procesa un evento personalizado (ej: cumpleaños, aniversario) y otorga puntos según las reglas de recompensa activas. ' +
      'El evento debe tener un eventId único (sourceEventId) para garantizar idempotencia.',
  })
  @ApiBody({
    description: 'Datos del evento personalizado',
    type: ProcessCustomEventRequest,
  })
  @ApiResponse({
    status: 200,
    description: 'Evento procesado exitosamente',
    type: ProcessLoyaltyEventResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No autorizado',
    type: ForbiddenErrorResponseDto,
  })
  async processCustomEvent(
    @Body() request: ProcessCustomEventRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProcessLoyaltyEventResult> {
    // Validaciones básicas
    if (!request.eventId || request.eventId.trim() === '') {
      throw new BadRequestException('eventId is required');
    }
    if (!request.eventType || request.eventType.trim() === '') {
      throw new BadRequestException('eventType is required');
    }
    if (!request.tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    if (!request.membershipRef) {
      throw new BadRequestException('membershipRef is required');
    }

    // Construir evento de lealtad
    const loyaltyEvent: Partial<LoyaltyEvent> = {
      eventType: 'CUSTOM',
      sourceEventId: request.eventId,
      tenantId: request.tenantId,
      membershipRef: request.membershipRef,
      occurredAt: request.occurredAt ? new Date(request.occurredAt) : new Date(),
      payload: {
        customEventType: request.eventType,
        amount: request.amount || null,
        currency: request.currency || null,
        storeId: request.storeId || null,
        branchId: request.branchId || null,
        channel: request.channel || null,
        ...(request.metadata || {}),
      },
      correlationId: request.correlationId || null,
      createdBy: user.email || 'SYSTEM',
      metadata: request.metadata || null,
    };

    // Procesar evento
    return await this.processLoyaltyEventHandler.execute(loyaltyEvent);
  }
}

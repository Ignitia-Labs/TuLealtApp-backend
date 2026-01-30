import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
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
 * DTO para procesar evento de compra
 */
class ProcessPurchaseEventRequest {
  tenantId: number;
  orderId: string; // sourceEventId
  occurredAt: Date;
  membershipRef: {
    membershipId?: number | null;
    customerId?: number | null;
    tenantId?: number | null;
    qrCode?: string | null;
  };
  netAmount: number;
  grossAmount: number;
  currency: string;
  items: Array<{
    sku: string;
    qty: number;
    unitPrice: number;
    categoryId?: number | null;
    categoryName?: string | null;
    productName?: string | null;
  }>;
  paymentMethod?: string | null;
  paymentStatus?: 'PAID' | 'PENDING' | 'REFUNDED' | 'CANCELLED' | null;
  storeId?: number | null;
  branchId?: number | null;
  channel?: string | null;
  correlationId?: string | null;
  metadata?: Record<string, any> | null;
}

/**
 * DTO para procesar evento de visita
 */
class ProcessVisitEventRequest {
  tenantId: number;
  visitId: string; // sourceEventId
  occurredAt: Date;
  membershipRef: {
    membershipId?: number | null;
    customerId?: number | null;
    tenantId?: number | null;
    qrCode?: string | null;
  };
  storeId?: number | null;
  branchId?: number | null;
  channel?: string | null;
  visitType?: string | null;
  durationMinutes?: number | null;
  correlationId?: string | null;
  metadata?: Record<string, any> | null;
}

/**
 * DTO para procesar evento personalizado
 */
class ProcessCustomEventRequest {
  tenantId: number;
  eventId: string; // sourceEventId
  eventType: string; // Tipo personalizado (ej: "BIRTHDAY", "ANNIVERSARY")
  occurredAt: Date;
  membershipRef: {
    membershipId?: number | null;
    customerId?: number | null;
    tenantId?: number | null;
    qrCode?: string | null;
  };
  amount?: number | null; // Monto opcional para eventos con valor
  currency?: string | null;
  storeId?: number | null;
  branchId?: number | null;
  channel?: string | null;
  correlationId?: string | null;
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
    if (!request.items || !Array.isArray(request.items) || request.items.length === 0) {
      throw new BadRequestException('items array is required and must not be empty');
    }

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
        items: request.items,
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

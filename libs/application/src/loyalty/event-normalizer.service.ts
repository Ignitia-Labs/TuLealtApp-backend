import { Injectable, BadRequestException } from '@nestjs/common';
import { LoyaltyEvent, LoyaltyEventType, MembershipRef } from '@libs/domain';

/**
 * Servicio para normalizar eventos entrantes a formato estándar
 * Valida que los eventos cumplan con el contrato requerido
 */
@Injectable()
export class EventNormalizer {
  /**
   * Normaliza un evento entrante a formato estándar LoyaltyEvent
   * Valida que tenga todos los campos obligatorios
   */
  normalize(event: Partial<LoyaltyEvent>): LoyaltyEvent {
    // Validación 1: tenantId obligatorio
    if (!event.tenantId) {
      throw new BadRequestException('tenantId is required');
    }

    // Validación 2: eventType obligatorio y válido
    if (!event.eventType) {
      throw new BadRequestException('eventType is required');
    }
    const validEventTypes: LoyaltyEventType[] = [
      'VISIT',
      'PURCHASE',
      'REFERRAL',
      'SUBSCRIPTION',
      'RETENTION',
      'CUSTOM',
    ];
    if (!validEventTypes.includes(event.eventType)) {
      throw new BadRequestException(
        `Invalid eventType: ${event.eventType}. Must be one of: ${validEventTypes.join(', ')}`,
      );
    }

    // Validación 3: sourceEventId obligatorio (HARD RULE)
    if (!event.sourceEventId || event.sourceEventId.trim() === '') {
      throw new BadRequestException(
        'sourceEventId is required (HARD RULE). Cannot process event without stable sourceEventId.',
      );
    }

    // Validación 4: occurredAt obligatorio
    if (!event.occurredAt) {
      throw new BadRequestException('occurredAt is required');
    }
    // Asegurar que occurredAt sea un Date
    const occurredAt =
      event.occurredAt instanceof Date ? event.occurredAt : new Date(event.occurredAt);

    // Validación 5: membershipRef obligatorio
    if (!event.membershipRef) {
      throw new BadRequestException('membershipRef is required');
    }
    const membershipRef = this.validateMembershipRef(event.membershipRef);

    // Validación 6: payload obligatorio
    if (!event.payload) {
      throw new BadRequestException('payload is required');
    }
    const payload = this.validatePayload(event.eventType, event.payload);

    // Construir evento normalizado
    return {
      tenantId: event.tenantId,
      eventType: event.eventType,
      sourceEventId: event.sourceEventId.trim(),
      occurredAt,
      membershipRef,
      payload,
      correlationId: event.correlationId || null,
      createdBy: event.createdBy || null,
      metadata: event.metadata || null,
    };
  }

  /**
   * Valida y normaliza membershipRef
   */
  private validateMembershipRef(ref: MembershipRef): MembershipRef {
    // Debe tener al menos una forma de resolver membership
    if ((!ref.membershipId && !ref.customerId) || (!ref.tenantId && !ref.qrCode)) {
      throw new BadRequestException(
        'membershipRef must have either: membershipId, or (customerId+tenantId), or qrCode',
      );
    }

    return {
      membershipId: ref.membershipId || null,
      customerId: ref.customerId || null,
      tenantId: ref.tenantId || null,
      qrCode: ref.qrCode || null,
    };
  }

  /**
   * Valida payload según el tipo de evento
   */
  private validatePayload(eventType: LoyaltyEventType, payload: any): any {
    switch (eventType) {
      case 'PURCHASE':
        return this.validatePurchasePayload(payload);
      case 'VISIT':
        return this.validateVisitPayload(payload);
      case 'REFERRAL':
        return this.validateReferralPayload(payload);
      case 'SUBSCRIPTION':
        return this.validateSubscriptionPayload(payload);
      case 'RETENTION':
        return this.validateRetentionPayload(payload);
      case 'CUSTOM':
        return this.validateCustomPayload(payload);
      default:
        throw new BadRequestException(`Unknown eventType: ${eventType}`);
    }
  }

  /**
   * Valida payload de PURCHASE
   */
  private validatePurchasePayload(payload: any): any {
    if (!payload.orderId) {
      throw new BadRequestException('PURCHASE payload requires orderId');
    }
    if (typeof payload.netAmount !== 'number' || payload.netAmount < 0) {
      throw new BadRequestException('PURCHASE payload requires valid netAmount (>= 0)');
    }
    if (typeof payload.grossAmount !== 'number' || payload.grossAmount < 0) {
      throw new BadRequestException('PURCHASE payload requires valid grossAmount (>= 0)');
    }
    if (!payload.currency || typeof payload.currency !== 'string') {
      throw new BadRequestException('PURCHASE payload requires currency (string)');
    }
    if (!Array.isArray(payload.items)) {
      throw new BadRequestException('PURCHASE payload requires items (array)');
    }
    // Validar items básicos
    for (const item of payload.items) {
      if (!item.sku || typeof item.sku !== 'string') {
        throw new BadRequestException('PURCHASE items require sku (string)');
      }
      if (typeof item.qty !== 'number' || item.qty <= 0) {
        throw new BadRequestException('PURCHASE items require qty (number > 0)');
      }
      if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
        throw new BadRequestException('PURCHASE items require unitPrice (number >= 0)');
      }
    }
    return payload;
  }

  /**
   * Valida payload de VISIT
   * Valida tipos de datos según VisitEventPayload interface
   */
  private validateVisitPayload(payload: any): any {
    // VISIT payload es opcional, pero si se proporciona debe tener tipos correctos
    if (!payload) {
      return {};
    }

    const validated: any = {};

    // Validar storeId (debe ser number o null)
    if (payload.storeId !== undefined && payload.storeId !== null) {
      if (typeof payload.storeId !== 'number' || payload.storeId <= 0) {
        throw new BadRequestException('VISIT payload storeId must be a positive number or null');
      }
      validated.storeId = payload.storeId;
    } else {
      validated.storeId = null;
    }

    // Validar branchId (debe ser number o null)
    if (payload.branchId !== undefined && payload.branchId !== null) {
      if (typeof payload.branchId !== 'number' || payload.branchId <= 0) {
        throw new BadRequestException('VISIT payload branchId must be a positive number or null');
      }
      validated.branchId = payload.branchId;
    } else {
      validated.branchId = null;
    }

    // Validar channel (debe ser string o null)
    if (payload.channel !== undefined && payload.channel !== null) {
      if (typeof payload.channel !== 'string') {
        throw new BadRequestException('VISIT payload channel must be a string or null');
      }
      validated.channel = payload.channel.trim() || null;
    } else {
      validated.channel = null;
    }

    // Validar visitType (debe ser string o null)
    if (payload.visitType !== undefined && payload.visitType !== null) {
      if (typeof payload.visitType !== 'string') {
        throw new BadRequestException('VISIT payload visitType must be a string or null');
      }
      validated.visitType = payload.visitType.trim() || null;
    } else {
      validated.visitType = null;
    }

    // Validar durationMinutes (debe ser number o null)
    if (payload.durationMinutes !== undefined && payload.durationMinutes !== null) {
      if (typeof payload.durationMinutes !== 'number' || payload.durationMinutes < 0) {
        throw new BadRequestException(
          'VISIT payload durationMinutes must be a non-negative number or null',
        );
      }
      validated.durationMinutes = payload.durationMinutes;
    } else {
      validated.durationMinutes = null;
    }

    // Validar metadata (debe ser object o null)
    if (payload.metadata !== undefined && payload.metadata !== null) {
      if (typeof payload.metadata !== 'object' || Array.isArray(payload.metadata)) {
        throw new BadRequestException('VISIT payload metadata must be an object or null');
      }
      validated.metadata = payload.metadata;
    } else {
      validated.metadata = null;
    }

    return validated;
  }

  /**
   * Valida payload de REFERRAL
   */
  private validateReferralPayload(payload: any): any {
    if (!payload.referredMembershipId || typeof payload.referredMembershipId !== 'number') {
      throw new BadRequestException('REFERRAL payload requires referredMembershipId (number)');
    }
    return payload;
  }

  /**
   * Valida payload de SUBSCRIPTION
   */
  private validateSubscriptionPayload(payload: any): any {
    if (!payload.subscriptionId || typeof payload.subscriptionId !== 'number') {
      throw new BadRequestException('SUBSCRIPTION payload requires subscriptionId (number)');
    }
    const validTypes = ['STARTED', 'RENEWED', 'CANCELLED', 'UPGRADED', 'DOWNGRADED'];
    if (!payload.subscriptionType || !validTypes.includes(payload.subscriptionType)) {
      throw new BadRequestException(
        `SUBSCRIPTION payload requires subscriptionType (one of: ${validTypes.join(', ')})`,
      );
    }
    return payload;
  }

  /**
   * Valida payload de RETENTION
   */
  private validateRetentionPayload(payload: any): any {
    const validStreakTypes = ['VISIT', 'PURCHASE', 'MIXED'];
    if (!payload.streakType || !validStreakTypes.includes(payload.streakType)) {
      throw new BadRequestException(
        `RETENTION payload requires streakType (one of: ${validStreakTypes.join(', ')})`,
      );
    }
    if (typeof payload.streakCount !== 'number' || payload.streakCount <= 0) {
      throw new BadRequestException('RETENTION payload requires streakCount (number > 0)');
    }
    if (!payload.periodStart || !payload.periodEnd) {
      throw new BadRequestException('RETENTION payload requires periodStart and periodEnd (Date)');
    }
    return payload;
  }

  /**
   * Valida payload de CUSTOM
   * CUSTOM acepta cualquier estructura, pero requiere customType
   */
  private validateCustomPayload(payload: any): any {
    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException('CUSTOM payload must be an object');
    }
    if (
      !payload.customType ||
      typeof payload.customType !== 'string' ||
      payload.customType.trim() === ''
    ) {
      throw new BadRequestException('CUSTOM payload requires customType (non-empty string)');
    }
    // CUSTOM acepta cualquier campo adicional, así que solo validamos customType
    return payload;
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EventNormalizer } from '../event-normalizer.service';
import { LoyaltyEvent } from '@libs/domain';

describe('EventNormalizer', () => {
  let service: EventNormalizer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventNormalizer],
    }).compile();

    service = module.get<EventNormalizer>(EventNormalizer);
  });

  describe('normalize', () => {
    it('should normalize a valid PURCHASE event', () => {
      const event: Partial<LoyaltyEvent> = {
        tenantId: 1,
        eventType: 'PURCHASE',
        sourceEventId: 'ORDER-123',
        occurredAt: new Date('2025-01-28T10:00:00Z'),
        membershipRef: {
          membershipId: 100,
        },
        payload: {
          orderId: 'ORDER-123',
          netAmount: 100.0,
          grossAmount: 120.0,
          currency: 'GTQ',
          items: [
            {
              sku: 'SKU-001',
              qty: 2,
              unitPrice: 50.0,
            },
          ],
        },
      };

      const normalized = service.normalize(event);

      expect(normalized.tenantId).toBe(1);
      expect(normalized.eventType).toBe('PURCHASE');
      expect(normalized.sourceEventId).toBe('ORDER-123');
      expect(normalized.membershipRef.membershipId).toBe(100);
    });

    it('should normalize a valid VISIT event', () => {
      const event: Partial<LoyaltyEvent> = {
        tenantId: 1,
        eventType: 'VISIT',
        sourceEventId: 'VISIT-456',
        occurredAt: new Date('2025-01-28T10:00:00Z'),
        membershipRef: {
          qrCode: 'QR-123',
        },
        payload: {
          storeId: 1,
          branchId: 2,
          channel: 'in-store',
        },
      };

      const normalized = service.normalize(event);

      expect(normalized.eventType).toBe('VISIT');
      expect(normalized.membershipRef.qrCode).toBe('QR-123');
    });

    it('should throw error if tenantId is missing', () => {
      const event: Partial<LoyaltyEvent> = {
        eventType: 'PURCHASE',
        sourceEventId: 'ORDER-123',
        occurredAt: new Date(),
        membershipRef: { membershipId: 100 },
        payload: {
          orderId: 'ORDER-123',
          netAmount: 100,
          grossAmount: 120,
          currency: 'GTQ',
          items: [],
        },
      };

      expect(() => service.normalize(event)).toThrow(BadRequestException);
      expect(() => service.normalize(event)).toThrow('tenantId is required');
    });

    it('should throw error if sourceEventId is missing (HARD RULE)', () => {
      const event: Partial<LoyaltyEvent> = {
        tenantId: 1,
        eventType: 'PURCHASE',
        occurredAt: new Date(),
        membershipRef: { membershipId: 100 },
        payload: {
          orderId: 'ORDER-123',
          netAmount: 100,
          grossAmount: 120,
          currency: 'GTQ',
          items: [],
        },
      };

      expect(() => service.normalize(event)).toThrow(BadRequestException);
      expect(() => service.normalize(event)).toThrow('sourceEventId is required');
    });

    it('should throw error if sourceEventId is empty string', () => {
      const event: Partial<LoyaltyEvent> = {
        tenantId: 1,
        eventType: 'PURCHASE',
        sourceEventId: '   ',
        occurredAt: new Date(),
        membershipRef: { membershipId: 100 },
        payload: {
          orderId: 'ORDER-123',
          netAmount: 100,
          grossAmount: 120,
          currency: 'GTQ',
          items: [],
        },
      };

      expect(() => service.normalize(event)).toThrow(BadRequestException);
    });

    it('should throw error if PURCHASE payload is missing orderId', () => {
      const event: Partial<LoyaltyEvent> = {
        tenantId: 1,
        eventType: 'PURCHASE',
        sourceEventId: 'ORDER-123',
        occurredAt: new Date(),
        membershipRef: { membershipId: 100 },
        payload: {
          netAmount: 100,
          grossAmount: 120,
          currency: 'GTQ',
          items: [],
        } as any,
      };

      expect(() => service.normalize(event)).toThrow(BadRequestException);
      expect(() => service.normalize(event)).toThrow('orderId');
    });

    it('should normalize event with customerId+tenantId in membershipRef', () => {
      const event: Partial<LoyaltyEvent> = {
        tenantId: 1,
        eventType: 'VISIT',
        sourceEventId: 'VISIT-789',
        occurredAt: new Date(),
        membershipRef: {
          customerId: 50,
          tenantId: 1,
        },
        payload: {},
      };

      const normalized = service.normalize(event);

      expect(normalized.membershipRef.customerId).toBe(50);
      expect(normalized.membershipRef.tenantId).toBe(1);
    });

    it('should trim sourceEventId whitespace', () => {
      const event: Partial<LoyaltyEvent> = {
        tenantId: 1,
        eventType: 'PURCHASE',
        sourceEventId: '  ORDER-123  ',
        occurredAt: new Date(),
        membershipRef: { membershipId: 100 },
        payload: {
          orderId: 'ORDER-123',
          netAmount: 100,
          grossAmount: 120,
          currency: 'GTQ',
          items: [],
        },
      };

      const normalized = service.normalize(event);
      expect(normalized.sourceEventId).toBe('ORDER-123');
    });
  });
});

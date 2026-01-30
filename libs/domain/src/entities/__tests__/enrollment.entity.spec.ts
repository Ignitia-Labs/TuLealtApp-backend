import { Enrollment } from '../enrollment.entity';

describe('Enrollment Entity', () => {
  const baseDate = new Date('2024-01-01T10:00:00Z');
  const futureDate = new Date('2025-12-31T23:59:59Z');

  describe('create', () => {
    it('should create an enrollment with all required fields', () => {
      const enrollment = Enrollment.create(100, 1); // membershipId, programId

      expect(enrollment.membershipId).toBe(100);
      expect(enrollment.programId).toBe(1);
      expect(enrollment.status).toBe('ACTIVE');
      expect(enrollment.effectiveFrom).toBeInstanceOf(Date);
      expect(enrollment.effectiveTo).toBeNull();
      expect(enrollment.metadata).toBeNull();
      expect(enrollment.createdAt).toBeInstanceOf(Date);
      expect(enrollment.updatedAt).toBeInstanceOf(Date);
    });

    it('should create an enrollment with optional fields', () => {
      const enrollment = Enrollment.create(
        100,
        1,
        baseDate,
        futureDate,
        { campaign: 'summer2025', source: 'email' },
        'ACTIVE',
        1, // id
      );

      expect(enrollment.id).toBe(1);
      expect(enrollment.effectiveFrom).toEqual(baseDate);
      expect(enrollment.effectiveTo).toEqual(futureDate);
      expect(enrollment.metadata).toEqual({ campaign: 'summer2025', source: 'email' });
      expect(enrollment.status).toBe('ACTIVE');
    });

    it('should throw error if effectiveTo is before effectiveFrom', () => {
      const pastDate = new Date('2020-01-01T00:00:00Z');

      expect(() => {
        Enrollment.create(100, 1, baseDate, pastDate);
      }).toThrow('effectiveTo must be after effectiveFrom');
    });

    it('should throw error if effectiveTo equals effectiveFrom', () => {
      expect(() => {
        Enrollment.create(100, 1, baseDate, baseDate);
      }).toThrow('effectiveTo must be after effectiveFrom');
    });
  });

  describe('isActive', () => {
    it('should return true for ACTIVE enrollment without date restrictions', () => {
      const enrollment = Enrollment.create(100, 1, baseDate, null, null, 'ACTIVE');

      expect(enrollment.isActive()).toBe(true);
    });

    it('should return false for PAUSED enrollment', () => {
      const enrollment = Enrollment.create(100, 1, baseDate, null, null, 'PAUSED');

      expect(enrollment.isActive()).toBe(false);
    });

    it('should return false for ENDED enrollment', () => {
      const enrollment = Enrollment.create(100, 1, baseDate, null, null, 'ENDED');

      expect(enrollment.isActive()).toBe(false);
    });

    it('should return false if effectiveFrom is in the future', () => {
      const futureDate = new Date('2099-01-01T00:00:00Z');
      const enrollment = Enrollment.create(100, 1, futureDate, null, null, 'ACTIVE');

      expect(enrollment.isActive()).toBe(false);
    });

    it('should return false if effectiveTo is in the past', () => {
      const pastDate = new Date('2020-01-01T00:00:00Z');
      const enrollment = Enrollment.create(100, 1, baseDate, pastDate, null, 'ACTIVE');

      expect(enrollment.isActive()).toBe(false);
    });

    it('should return true if enrollment is within effective date range', () => {
      const pastDate = new Date('2020-01-01T00:00:00Z');
      const futureDate = new Date('2099-01-01T00:00:00Z');
      const enrollment = Enrollment.create(100, 1, pastDate, futureDate, null, 'ACTIVE');

      expect(enrollment.isActive()).toBe(true);
    });
  });

  describe('activate', () => {
    it('should activate a PAUSED enrollment', () => {
      const enrollment = Enrollment.create(100, 1, baseDate, null, null, 'PAUSED');

      const activated = enrollment.activate();

      expect(activated.status).toBe('ACTIVE');
      expect(activated.id).toBe(enrollment.id);
      expect(activated.membershipId).toBe(enrollment.membershipId);
      expect(activated.programId).toBe(enrollment.programId);
    });

    it('should activate with custom effectiveFrom date', () => {
      const enrollment = Enrollment.create(100, 1, baseDate, null, null, 'PAUSED');
      const customDate = new Date('2025-06-01T00:00:00Z');

      const activated = enrollment.activate(customDate);

      expect(activated.status).toBe('ACTIVE');
      expect(activated.effectiveFrom).toEqual(customDate);
    });

    it('should keep original effectiveFrom if not provided', () => {
      const enrollment = Enrollment.create(100, 1, baseDate, null, null, 'PAUSED');

      const activated = enrollment.activate();

      expect(activated.effectiveFrom).toEqual(baseDate);
    });
  });

  describe('pause', () => {
    it('should pause an ACTIVE enrollment', () => {
      const enrollment = Enrollment.create(100, 1, baseDate, null, null, 'ACTIVE');

      const paused = enrollment.pause();

      expect(paused.status).toBe('PAUSED');
      expect(paused.id).toBe(enrollment.id);
      expect(paused.effectiveFrom).toEqual(enrollment.effectiveFrom);
      expect(paused.effectiveTo).toEqual(enrollment.effectiveTo);
    });

    it('should preserve metadata when pausing', () => {
      const metadata = { campaign: 'summer2025' };
      const enrollment = Enrollment.create(100, 1, baseDate, null, metadata, 'ACTIVE');

      const paused = enrollment.pause();

      expect(paused.metadata).toEqual(metadata);
    });
  });

  describe('end', () => {
    it('should end an ACTIVE enrollment', () => {
      const enrollment = Enrollment.create(100, 1, baseDate, null, null, 'ACTIVE');

      const ended = enrollment.end();

      expect(ended.status).toBe('ENDED');
      expect(ended.id).toBe(enrollment.id);
      expect(ended.effectiveTo).toBeInstanceOf(Date);
    });

    it('should end with custom effectiveTo date', () => {
      const enrollment = Enrollment.create(100, 1, baseDate, null, null, 'ACTIVE');
      const customDate = new Date('2025-06-01T00:00:00Z');

      const ended = enrollment.end(customDate);

      expect(ended.status).toBe('ENDED');
      expect(ended.effectiveTo).toEqual(customDate);
    });

    it('should use current date if effectiveTo not provided', () => {
      const enrollment = Enrollment.create(100, 1, baseDate, null, null, 'ACTIVE');

      const ended = enrollment.end();

      expect(ended.effectiveTo).toBeInstanceOf(Date);
      expect(ended.effectiveTo!.getTime()).toBeGreaterThanOrEqual(Date.now() - 1000); // Allow 1 second tolerance
    });
  });

  describe('updateMetadata', () => {
    it('should update metadata', () => {
      const enrollment = Enrollment.create(100, 1, baseDate, null, { old: 'value' }, 'ACTIVE');

      const updated = enrollment.updateMetadata({ new: 'value', campaign: 'winter2025' });

      expect(updated.metadata).toEqual({ new: 'value', campaign: 'winter2025' });
      expect(updated.id).toBe(enrollment.id);
      expect(updated.status).toBe(enrollment.status);
    });

    it('should set metadata to null', () => {
      const enrollment = Enrollment.create(100, 1, baseDate, null, { old: 'value' }, 'ACTIVE');

      const updated = enrollment.updateMetadata(null);

      expect(updated.metadata).toBeNull();
    });

    it('should preserve other fields when updating metadata', () => {
      const enrollment = Enrollment.create(100, 1, baseDate, futureDate, null, 'ACTIVE');

      const updated = enrollment.updateMetadata({ new: 'value' });

      expect(updated.membershipId).toBe(enrollment.membershipId);
      expect(updated.programId).toBe(enrollment.programId);
      expect(updated.status).toBe(enrollment.status);
      expect(updated.effectiveFrom).toEqual(enrollment.effectiveFrom);
      expect(updated.effectiveTo).toEqual(enrollment.effectiveTo);
    });
  });
});

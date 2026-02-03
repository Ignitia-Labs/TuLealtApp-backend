/**
 * Entidad de dominio PartnerStaffAssignment
 * Representa la asignación de un usuario STAFF a un partner con un porcentaje de comisión
 * No depende de frameworks ni librerías externas
 */
export class PartnerStaffAssignment {
  constructor(
    public readonly id: number,
    public readonly partnerId: number,
    public readonly staffUserId: number,
    public readonly commissionPercent: number, // 0-100
    public readonly isActive: boolean,
    public readonly startDate: Date,
    public readonly endDate: Date | null, // null = sin fecha de fin
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear una nueva asignación
   * El ID es opcional porque será generado automáticamente por la base de datos
   */
  static create(
    partnerId: number,
    staffUserId: number,
    commissionPercent: number,
    startDate: Date,
    endDate: Date | null = null,
    notes: string | null = null,
    isActive: boolean = true,
    id?: number,
  ): PartnerStaffAssignment {
    // Validar porcentaje
    if (commissionPercent < 0 || commissionPercent > 100) {
      throw new Error(`Commission percent must be between 0 and 100, got ${commissionPercent}`);
    }

    // Validar fechas
    if (endDate !== null && startDate >= endDate) {
      throw new Error('startDate must be before endDate');
    }

    const now = new Date();
    return new PartnerStaffAssignment(
      id || 0,
      partnerId,
      staffUserId,
      commissionPercent,
      isActive,
      startDate,
      endDate,
      notes,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si la asignación está activa en una fecha específica
   */
  isActiveOnDate(date: Date): boolean {
    if (!this.isActive) {
      return false;
    }

    if (date < this.startDate) {
      return false;
    }

    if (this.endDate !== null && date > this.endDate) {
      return false;
    }

    return true;
  }

  /**
   * Método de dominio para desactivar la asignación
   */
  deactivate(): PartnerStaffAssignment {
    return new PartnerStaffAssignment(
      this.id,
      this.partnerId,
      this.staffUserId,
      this.commissionPercent,
      false,
      this.startDate,
      this.endDate,
      this.notes,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para activar la asignación
   */
  activate(): PartnerStaffAssignment {
    return new PartnerStaffAssignment(
      this.id,
      this.partnerId,
      this.staffUserId,
      this.commissionPercent,
      true,
      this.startDate,
      this.endDate,
      this.notes,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para actualizar el porcentaje de comisión
   */
  updateCommissionPercent(newPercent: number, notes: string | null = null): PartnerStaffAssignment {
    if (newPercent < 0 || newPercent > 100) {
      throw new Error(`Commission percent must be between 0 and 100, got ${newPercent}`);
    }

    return new PartnerStaffAssignment(
      this.id,
      this.partnerId,
      this.staffUserId,
      newPercent,
      this.isActive,
      this.startDate,
      this.endDate,
      notes,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para actualizar las fechas
   */
  updateDates(
    startDate: Date,
    endDate: Date | null = null,
    notes: string | null = null,
  ): PartnerStaffAssignment {
    if (endDate !== null && startDate >= endDate) {
      throw new Error('startDate must be before endDate');
    }

    return new PartnerStaffAssignment(
      this.id,
      this.partnerId,
      this.staffUserId,
      this.commissionPercent,
      this.isActive,
      startDate,
      endDate,
      notes,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para verificar si hay solapamiento de fechas con otra asignación
   */
  overlapsWith(other: PartnerStaffAssignment): boolean {
    // Si una de las asignaciones no está activa, no hay solapamiento
    if (!this.isActive || !other.isActive) {
      return false;
    }

    // Si son diferentes partners o staff, no hay solapamiento
    if (this.partnerId !== other.partnerId || this.staffUserId !== other.staffUserId) {
      return false;
    }

    // Si es la misma asignación, no hay solapamiento
    if (this.id === other.id && this.id > 0) {
      return false;
    }

    // Verificar solapamiento de fechas
    const thisStart = this.startDate.getTime();
    const thisEnd = this.endDate ? this.endDate.getTime() : Infinity;
    const otherStart = other.startDate.getTime();
    const otherEnd = other.endDate ? other.endDate.getTime() : Infinity;

    // Hay solapamiento si los rangos se intersectan
    return thisStart < otherEnd && otherStart < thisEnd;
  }
}

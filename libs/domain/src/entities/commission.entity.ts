/**
 * Entidad de dominio Commission
 * Representa una comisión calculada para un usuario STAFF basada en un pago o billing cycle
 * No depende de frameworks ni librerías externas
 */
export type CommissionStatus = 'pending' | 'paid' | 'cancelled';

export class Commission {
  constructor(
    public readonly id: number,
    public readonly partnerId: number,
    public readonly staffUserId: number,
    public readonly paymentId: number | null,
    public readonly subscriptionId: number,
    public readonly assignmentId: number, // ID de la asignación que generó esta comisión
    public readonly paymentAmount: number, // Monto total del pago
    public readonly commissionPercent: number, // Porcentaje aplicado
    public readonly commissionAmount: number, // Monto calculado de comisión
    public readonly currency: string,
    public readonly paymentDate: Date,
    public readonly status: CommissionStatus,
    public readonly paidDate: Date | null,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly billingCycleId: number | null = null, // ID del billing cycle asociado (opcional en Fase 1)
  ) {}

  /**
   * Factory method para crear una nueva comisión
   * El ID es opcional porque será generado automáticamente por la base de datos
   *
   * FASE 3: paymentId y billingCycleId son opcionales, pero al menos uno debe estar presente
   * - Si billingCycleId está presente, se usa como referencia principal
   * - Si solo paymentId está presente, se mantiene compatibilidad con pagos sin billing cycle
   */
  static create(
    partnerId: number,
    staffUserId: number,
    paymentId: number | null,
    subscriptionId: number,
    assignmentId: number,
    paymentAmount: number,
    commissionPercent: number,
    currency: string,
    paymentDate: Date,
    notes: string | null = null,
    id?: number,
    billingCycleId: number | null = null,
  ): Commission {
    // Validar que al menos uno de paymentId o billingCycleId esté presente
    if (!paymentId && !billingCycleId) {
      throw new Error(
        'Commission must have either paymentId or billingCycleId (or both)',
      );
    }

    // Validar porcentaje
    if (commissionPercent < 0 || commissionPercent > 100) {
      throw new Error(
        `Commission percent must be between 0 and 100, got ${commissionPercent}`,
      );
    }

    // Validar montos
    if (paymentAmount < 0) {
      throw new Error(`Payment amount must be >= 0, got ${paymentAmount}`);
    }

    // Calcular monto de comisión
    const commissionAmount = (paymentAmount * commissionPercent) / 100;

    if (commissionAmount < 0) {
      throw new Error(
        `Commission amount must be >= 0, got ${commissionAmount}`,
      );
    }

    const now = new Date();
    return new Commission(
      id || 0,
      partnerId,
      staffUserId,
      paymentId,
      subscriptionId,
      assignmentId,
      paymentAmount,
      commissionPercent,
      commissionAmount,
      currency,
      paymentDate,
      'pending',
      null,
      notes,
      now,
      now,
      billingCycleId,
    );
  }

  /**
   * Método de dominio para marcar la comisión como pagada
   */
  markAsPaid(paidDate: Date = new Date(), notes: string | null = null): Commission {
    if (this.status === 'cancelled') {
      throw new Error('Cannot mark a cancelled commission as paid');
    }

    return new Commission(
      this.id,
      this.partnerId,
      this.staffUserId,
      this.paymentId,
      this.subscriptionId,
      this.assignmentId,
      this.paymentAmount,
      this.commissionPercent,
      this.commissionAmount,
      this.currency,
      this.paymentDate,
      'paid',
      paidDate,
      notes || this.notes,
      this.createdAt,
      new Date(),
      this.billingCycleId,
    );
  }

  /**
   * Método de dominio para cancelar la comisión
   */
  cancel(notes: string | null = null): Commission {
    if (this.status === 'paid') {
      throw new Error('Cannot cancel a paid commission');
    }

    return new Commission(
      this.id,
      this.partnerId,
      this.staffUserId,
      this.paymentId,
      this.subscriptionId,
      this.assignmentId,
      this.paymentAmount,
      this.commissionPercent,
      this.commissionAmount,
      this.currency,
      this.paymentDate,
      'cancelled',
      this.paidDate,
      notes || this.notes,
      this.createdAt,
      new Date(),
      this.billingCycleId,
    );
  }

  /**
   * Método de dominio para verificar si la comisión está pendiente
   */
  isPending(): boolean {
    return this.status === 'pending';
  }

  /**
   * Método de dominio para verificar si la comisión está pagada
   */
  isPaid(): boolean {
    return this.status === 'paid';
  }

  /**
   * Método de dominio para verificar si la comisión está cancelada
   */
  isCancelled(): boolean {
    return this.status === 'cancelled';
  }
}


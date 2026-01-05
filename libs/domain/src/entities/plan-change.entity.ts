/**
 * Entidad de dominio PlanChange
 * Representa un cambio de plan en una suscripción
 * No depende de frameworks ni librerías externas
 */
export type PlanChangeType = 'upgrade' | 'downgrade' | 'sidegrade';
export type PlanChangeStatus = 'pending' | 'completed' | 'cancelled' | 'failed';

export class PlanChange {
  constructor(
    public readonly id: number,
    public readonly subscriptionId: number,
    public readonly partnerId: number,
    public readonly fromPlanId: string,
    public readonly fromPlanType: 'esencia' | 'conecta' | 'inspira',
    public readonly toPlanId: string,
    public readonly toPlanType: 'esencia' | 'conecta' | 'inspira',
    public readonly changeType: PlanChangeType,
    public readonly effectiveDate: Date,
    public readonly proratedAmount: number,
    public readonly creditIssued: number,
    public readonly additionalCharge: number,
    public readonly currency: string,
    public readonly status: PlanChangeStatus,
    public readonly processedAt: Date | null,
    public readonly reason: string | null,
    public readonly requestedBy: number,
    public readonly approvedBy: number | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo cambio de plan
   */
  static create(
    subscriptionId: number,
    partnerId: number,
    fromPlanId: string,
    fromPlanType: 'esencia' | 'conecta' | 'inspira',
    toPlanId: string,
    toPlanType: 'esencia' | 'conecta' | 'inspira',
    effectiveDate: Date,
    proratedAmount: number,
    currency: string,
    requestedBy: number,
    changeType: PlanChangeType,
    creditIssued: number = 0,
    additionalCharge: number = 0,
    reason: string | null = null,
    status: PlanChangeStatus = 'pending',
    approvedBy: number | null = null,
    processedAt: Date | null = null,
    id?: number,
  ): PlanChange {
    const now = new Date();
    return new PlanChange(
      id || 0,
      subscriptionId,
      partnerId,
      fromPlanId,
      fromPlanType,
      toPlanId,
      toPlanType,
      changeType,
      effectiveDate,
      proratedAmount,
      creditIssued,
      additionalCharge,
      currency,
      status,
      processedAt,
      reason,
      requestedBy,
      approvedBy,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si el cambio está completado
   */
  isCompleted(): boolean {
    return this.status === 'completed';
  }

  /**
   * Método de dominio para completar el cambio de plan
   */
  complete(approvedBy: number): PlanChange {
    return new PlanChange(
      this.id,
      this.subscriptionId,
      this.partnerId,
      this.fromPlanId,
      this.fromPlanType,
      this.toPlanId,
      this.toPlanType,
      this.changeType,
      this.effectiveDate,
      this.proratedAmount,
      this.creditIssued,
      this.additionalCharge,
      this.currency,
      'completed',
      new Date(),
      this.reason,
      this.requestedBy,
      approvedBy,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para cancelar el cambio de plan
   */
  cancel(): PlanChange {
    return new PlanChange(
      this.id,
      this.subscriptionId,
      this.partnerId,
      this.fromPlanId,
      this.fromPlanType,
      this.toPlanId,
      this.toPlanType,
      this.changeType,
      this.effectiveDate,
      this.proratedAmount,
      this.creditIssued,
      this.additionalCharge,
      this.currency,
      'cancelled',
      this.processedAt,
      this.reason,
      this.requestedBy,
      this.approvedBy,
      this.createdAt,
      new Date(),
    );
  }
}

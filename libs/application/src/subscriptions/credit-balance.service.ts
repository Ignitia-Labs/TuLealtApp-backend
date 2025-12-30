import { Injectable, Inject } from '@nestjs/common';
import { IPaymentRepository } from '@libs/domain';
import { roundToTwoDecimals } from '@libs/shared';

/**
 * Servicio para calcular el crédito disponible dinámicamente desde los pagos reales
 * Evita usar el creditBalance almacenado que puede estar desactualizado
 */
@Injectable()
export class CreditBalanceService {
  constructor(
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  /**
   * Calcula el crédito disponible dinámicamente desde los pagos reales
   *
   * El crédito es la suma de los montos restantes de los pagos originales que no se han aplicado completamente.
   * Un pago original es aquel que no tiene originalPaymentId o es 0.
   *
   * @param subscriptionId ID de la suscripción
   * @param currency Moneda de la suscripción
   * @returns Crédito disponible calculado dinámicamente
   */
  async calculateAvailableCreditBalance(
    subscriptionId: number,
    currency: string,
  ): Promise<number> {
    // Obtener todos los pagos de la suscripción
    const allPayments = await this.paymentRepository.findBySubscriptionId(subscriptionId);

    // Filtrar solo payments originales (no derivados) que están pagados y en la moneda correcta
    // Un payment es original si no tiene originalPaymentId o es 0
    const originalPayments = allPayments.filter(
      (p) =>
        p.status === 'paid' &&
        (!p.originalPaymentId || p.originalPaymentId === 0) &&
        p.currency === currency,
    );

    // Calcular crédito disponible dinámicamente
    let calculatedCreditBalance = 0;

    for (const payment of originalPayments) {
      // Obtener todos los payments derivados de este payment original
      const derivedPayments = await this.paymentRepository.findDerivedByOriginalPaymentId(payment.id);

      // Filtrar solo payments derivados que están realmente aplicados a un billing cycle o invoice válido
      const validDerivedPayments = derivedPayments.filter(
        (dp) => dp.billingCycleId !== null || dp.invoiceId !== null,
      );

      // Calcular cuánto se ha aplicado de este payment original
      const appliedAmount = validDerivedPayments.reduce((sum, dp) => {
        const amount = Number(dp.amount);
        if (isNaN(amount)) {
          console.warn(`Payment derivado ${dp.id} tiene amount inválido: ${dp.amount}`);
          return sum;
        }
        return sum + amount;
      }, 0);

      // El crédito disponible es el monto restante del payment original
      const paymentAmount = Number(payment.amount);
      if (isNaN(paymentAmount)) {
        console.warn(`Payment original ${payment.id} tiene amount inválido: ${payment.amount}`);
        continue;
      }
      const remainingAmount = Math.max(0, paymentAmount - appliedAmount);
      calculatedCreditBalance += remainingAmount;
    }

    // Redondear a 2 decimales
    return roundToTwoDecimals(calculatedCreditBalance);
  }
}


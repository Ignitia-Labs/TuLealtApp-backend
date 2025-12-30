/**
 * Utilidades matemáticas para manejo de precisión decimal
 */

/**
 * Redondea un número a 2 decimales
 * Evita problemas de precisión de punto flotante
 * Maneja valores null/undefined devolviendo 0
 */
export function roundToTwoDecimals(amount: number | null | undefined): number {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 0;
  }
  return Math.round(amount * 100) / 100;
}

/**
 * Verifica si dos montos son iguales considerando precisión decimal
 */
export function amountsEqual(amount1: number, amount2: number, tolerance = 0.01): boolean {
  return Math.abs(amount1 - amount2) < tolerance;
}

/**
 * Verifica si un monto es mayor o igual a otro considerando precisión decimal
 */
export function amountGreaterOrEqual(amount1: number, amount2: number, tolerance = 0.01): boolean {
  return amount1 >= amount2 - tolerance;
}


/**
 * Interfaz que deben implementar todas las seeds
 * Define el contrato para ejecutar una seed de manera idempotente
 */
export interface ISeed {
  /**
   * Nombre descriptivo de la seed
   */
  getName(): string;

  /**
   * Ejecuta la seed de manera idempotente
   * Debe verificar si los datos ya existen antes de crearlos
   */
  run(): Promise<void>;
}


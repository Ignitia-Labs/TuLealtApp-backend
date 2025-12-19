import { ISeed } from '../interfaces/seed.interface';

/**
 * Clase base abstracta para todas las seeds
 * Proporciona funcionalidad común y estructura estándar
 */
export abstract class BaseSeed implements ISeed {
  /**
   * Nombre de la seed (debe ser implementado por las clases hijas)
   */
  abstract getName(): string;

  /**
   * Método principal que ejecuta la seed
   * Debe ser implementado por las clases hijas
   */
  abstract run(): Promise<void>;

  /**
   * Método helper para logging
   */
  protected log(message: string): void {
    console.log(`[SEED: ${this.getName()}] ${message}`);
  }

  /**
   * Método helper para logging de errores
   */
  protected error(message: string, error?: any): void {
    console.error(`[SEED: ${this.getName()}] ERROR: ${message}`, error);
  }
}

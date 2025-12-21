/**
 * Payload del JWT token
 * Contiene la información del usuario que se incluye en el token
 */
export interface JwtPayload {
  /**
   * ID del usuario
   */
  userId: number;

  /**
   * Email del usuario
   */
  email: string;

  /**
   * Roles del usuario
   */
  roles: string[];

  /**
   * Contexto de la aplicación (admin, partner, customer)
   */
  context: string;

  /**
   * Tipo de token (access, refresh)
   */
  type?: 'access' | 'refresh';
}

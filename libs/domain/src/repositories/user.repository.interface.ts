import { User } from '../entities/user.entity';

/**
 * Interfaz del repositorio de usuarios
 * Define el contrato que debe cumplir cualquier implementación
 * La implementación concreta estará en la capa de infraestructura
 */
export interface IUserRepository {
  /**
   * Busca un usuario por su ID
   */
  findById(id: number): Promise<User | null>;

  /**
   * Busca un usuario por su email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Busca todos los usuarios (con paginación opcional)
   */
  findAll(skip?: number, take?: number): Promise<User[]>;

  /**
   * Guarda un nuevo usuario
   */
  save(user: User): Promise<User>;

  /**
   * Actualiza un usuario existente
   */
  update(user: User): Promise<User>;

  /**
   * Elimina un usuario por su ID
   */
  delete(id: number): Promise<void>;

  /**
   * Cuenta el total de usuarios
   */
  count(): Promise<number>;
}

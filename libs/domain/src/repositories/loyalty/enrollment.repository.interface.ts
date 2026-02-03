import { Enrollment } from '@libs/domain/entities/loyalty/enrollment.entity';

/**
 * Interfaz del repositorio de Enrollment
 * Define el contrato que debe cumplir cualquier implementación
 * La implementación concreta estará en la capa de infraestructura
 */
export interface IEnrollmentRepository {
  /**
   * Guarda un nuevo enrollment o actualiza uno existente
   */
  save(enrollment: Enrollment): Promise<Enrollment>;

  /**
   * Busca un enrollment por su ID
   */
  findById(id: number): Promise<Enrollment | null>;

  /**
   * Busca enrollments activos de una membership
   */
  findActiveByMembershipId(membershipId: number): Promise<Enrollment[]>;

  /**
   * Busca todos los enrollments de una membership (incluyendo inactivos)
   */
  findByMembershipId(membershipId: number): Promise<Enrollment[]>;

  /**
   * Busca enrollments activos de un programa
   */
  findActiveByProgramId(programId: number): Promise<Enrollment[]>;

  /**
   * Busca un enrollment específico por membership y programa
   */
  findByMembershipIdAndProgramId(
    membershipId: number,
    programId: number,
  ): Promise<Enrollment | null>;

  /**
   * Busca enrollments activos de una membership por tipo de programa
   */
  findActiveByMembershipIdAndProgramType(
    membershipId: number,
    programType: string,
  ): Promise<Enrollment[]>;

  /**
   * Verifica si una membership está enrollada en un programa específico
   */
  isEnrolled(membershipId: number, programId: number): Promise<boolean>;

  /**
   * Cuenta enrollments activos de una membership
   */
  countActiveByMembershipId(membershipId: number): Promise<number>;

  /**
   * Elimina un enrollment por su ID
   */
  delete(id: number): Promise<void>;
}

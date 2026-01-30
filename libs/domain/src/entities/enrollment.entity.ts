/**
 * Entidad de dominio Enrollment
 * Representa la inscripción de una membership en un programa de lealtad
 * No depende de frameworks ni librerías externas
 */
export type EnrollmentStatus = 'ACTIVE' | 'PAUSED' | 'ENDED';

export interface EnrollmentMetadata {
  [key: string]: any; // Metadatos flexibles (campaña, fuente, etc.)
}

export class Enrollment {
  constructor(
    public readonly id: number,
    public readonly membershipId: number,
    public readonly programId: number,
    public readonly status: EnrollmentStatus,
    public readonly effectiveFrom: Date,
    public readonly effectiveTo: Date | null,
    public readonly metadata: EnrollmentMetadata | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo enrollment
   */
  static create(
    membershipId: number,
    programId: number,
    effectiveFrom: Date = new Date(),
    effectiveTo: Date | null = null,
    metadata: EnrollmentMetadata | null = null,
    status: EnrollmentStatus = 'ACTIVE',
    id?: number,
  ): Enrollment {
    // Validaciones de dominio
    if (effectiveTo && effectiveTo <= effectiveFrom) {
      throw new Error('effectiveTo must be after effectiveFrom');
    }

    const now = new Date();
    return new Enrollment(
      id || 0,
      membershipId,
      programId,
      status,
      effectiveFrom,
      effectiveTo,
      metadata,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si el enrollment está activo
   */
  isActive(): boolean {
    if (this.status !== 'ACTIVE') {
      return false;
    }

    const now = new Date();

    // Verificar que esté dentro del rango de fechas efectivas
    if (now < this.effectiveFrom) {
      return false;
    }

    if (this.effectiveTo && now > this.effectiveTo) {
      return false;
    }

    return true;
  }

  /**
   * Método de dominio para activar el enrollment
   */
  activate(effectiveFrom?: Date): Enrollment {
    return new Enrollment(
      this.id,
      this.membershipId,
      this.programId,
      'ACTIVE',
      effectiveFrom || this.effectiveFrom,
      this.effectiveTo,
      this.metadata,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para pausar el enrollment
   */
  pause(): Enrollment {
    return new Enrollment(
      this.id,
      this.membershipId,
      this.programId,
      'PAUSED',
      this.effectiveFrom,
      this.effectiveTo,
      this.metadata,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para finalizar el enrollment
   */
  end(effectiveTo?: Date): Enrollment {
    return new Enrollment(
      this.id,
      this.membershipId,
      this.programId,
      'ENDED',
      this.effectiveFrom,
      effectiveTo || new Date(),
      this.metadata,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para actualizar metadatos
   */
  updateMetadata(metadata: EnrollmentMetadata | null): Enrollment {
    return new Enrollment(
      this.id,
      this.membershipId,
      this.programId,
      this.status,
      this.effectiveFrom,
      this.effectiveTo,
      metadata,
      this.createdAt,
      new Date(),
    );
  }
}

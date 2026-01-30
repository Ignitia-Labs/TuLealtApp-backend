import { EarningDomain } from '../constants/earning-domains';

/**
 * Entidad de dominio LoyaltyProgram
 * Representa un programa de lealtad dentro de un tenant
 * No depende de frameworks ni librerías externas
 *
 * IMPORTANTE: Todos los rewards deben pertenecer a un programa.
 * No existen rewards sueltas. Incluso un programa base por defecto debe existir.
 */
export type LoyaltyProgramType = 'BASE' | 'PROMO' | 'PARTNER' | 'SUBSCRIPTION' | 'EXPERIMENTAL';

export type LoyaltyProgramStatus = 'active' | 'inactive' | 'draft';

export interface EarningDomainItem {
  domain: EarningDomain; // ej: "BASE_PURCHASE", "BONUS_CATEGORY", "VISIT"
}

export interface StackingPolicy {
  allowed: boolean;
  maxProgramsPerEvent?: number;
  maxProgramsPerPeriod?: number;
  period?: 'daily' | 'weekly' | 'monthly';
  selectionStrategy?: 'BEST_VALUE' | 'PRIORITY_RANK' | 'FIRST_MATCH';
}

export interface ProgramLimits {
  maxPointsPerEvent?: number;
  maxPointsPerDay?: number;
  maxPointsPerMonth?: number;
  maxPointsPerYear?: number;
}

export interface ExpirationPolicy {
  enabled: boolean;
  type: 'simple' | 'bucketed'; // simple: expira todo junto, bucketed: FIFO por bucket
  /**
   * Días hasta que expiren los puntos
   * Si es undefined o null, se usará el valor por defecto del Tenant (tenant.pointsExpireDays)
   * Si tiene valor, sobrescribe el valor del Tenant para este programa específico
   * @see Tenant.pointsExpireDays
   */
  daysToExpire?: number; // null = nunca expira, undefined = usar valor del Tenant
  gracePeriodDays?: number;
}

export class LoyaltyProgram {
  constructor(
    public readonly id: number,
    public readonly tenantId: number,
    public readonly name: string,
    public readonly description: string | null,
    public readonly programType: LoyaltyProgramType,
    public readonly earningDomains: EarningDomainItem[],
    public readonly priorityRank: number, // Mayor rank = mayor prioridad
    public readonly stacking: StackingPolicy,
    public readonly limits: ProgramLimits | null,
    public readonly expirationPolicy: ExpirationPolicy,
    public readonly currency: string | null, // Código de moneda (ej: "USD", "GTQ")
    /**
     * Mínimo de puntos para canjear
     * Si es 0, se usará el valor por defecto del Tenant (tenant.minPointsToRedeem)
     * Si es > 0, sobrescribe el valor del Tenant para este programa específico
     * @see Tenant.minPointsToRedeem
     */
    public readonly minPointsToRedeem: number, // Mínimo de puntos para canjear
    public readonly status: LoyaltyProgramStatus,
    public readonly version: number, // Versionado para inmutabilidad histórica
    public readonly activeFrom: Date | null,
    public readonly activeTo: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo programa de lealtad
   */
  static create(
    tenantId: number,
    name: string,
    programType: LoyaltyProgramType,
    earningDomains: EarningDomainItem[],
    priorityRank: number,
    stacking: StackingPolicy,
    expirationPolicy: ExpirationPolicy,
    minPointsToRedeem: number = 0,
    description: string | null = null,
    limits: ProgramLimits | null = null,
    currency: string | null = null,
    status: LoyaltyProgramStatus = 'draft',
    version: number = 1,
    activeFrom: Date | null = null,
    activeTo: Date | null = null,
    id?: number,
  ): LoyaltyProgram {
    // Validaciones de dominio
    if (priorityRank < 0) {
      throw new Error('Priority rank must be non-negative');
    }

    if (minPointsToRedeem < 0) {
      throw new Error('minPointsToRedeem must be non-negative');
    }

    if (earningDomains.length === 0 && programType !== 'BASE') {
      throw new Error('Non-BASE programs must have at least one earning domain');
    }

    // BASE programs deben tener BASE_PURCHASE en earningDomains
    if (programType === 'BASE') {
      const hasBasePurchase = earningDomains.some((domain) => domain.domain === 'BASE_PURCHASE');
      if (!hasBasePurchase && earningDomains.length > 0) {
        throw new Error('BASE programs should include BASE_PURCHASE in earningDomains');
      }
    }

    const now = new Date();
    return new LoyaltyProgram(
      id || 0,
      tenantId,
      name,
      description,
      programType,
      earningDomains,
      priorityRank,
      stacking,
      limits,
      expirationPolicy,
      currency,
      minPointsToRedeem,
      status,
      version,
      activeFrom,
      activeTo,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si el programa está activo
   */
  isActive(): boolean {
    if (this.status !== 'active') {
      return false;
    }

    const now = new Date();

    // Si tiene activeFrom y aún no ha comenzado
    if (this.activeFrom && now < this.activeFrom) {
      return false;
    }

    // Si tiene activeTo y ya expiró
    if (this.activeTo && now > this.activeTo) {
      return false;
    }

    return true;
  }

  /**
   * Método de dominio para verificar si puede coexistir con otro programa
   * Basado en programType y stacking policy
   */
  canCoexistWith(other: LoyaltyProgram): boolean {
    // BASE programs son mutuamente excluyentes
    if (this.programType === 'BASE' && other.programType === 'BASE') {
      return false;
    }

    // Si stacking no está permitido, no pueden coexistir
    if (!this.stacking.allowed && !other.stacking.allowed) {
      return false;
    }

    // Verificar si comparten earningDomains conflictivos
    const thisDomains = this.getEarningDomains();
    const otherDomains = other.getEarningDomains();

    // Si ambos tienen BASE_PURCHASE, no pueden coexistir (a menos que explícitamente permitido)
    if (
      thisDomains.includes('BASE_PURCHASE') &&
      otherDomains.includes('BASE_PURCHASE') &&
      this.programType !== 'BASE' &&
      other.programType !== 'BASE'
    ) {
      // Solo permitir si ambos tienen stacking explícitamente permitido
      return this.stacking.allowed && other.stacking.allowed;
    }

    return true;
  }

  /**
   * Método de dominio para obtener los dominios de earning como array de strings
   */
  getEarningDomains(): string[] {
    return this.earningDomains.map((domain) => domain.domain);
  }

  /**
   * Método de dominio para verificar si el programa tiene un dominio específico
   */
  hasEarningDomain(domain: string): boolean {
    return this.getEarningDomains().includes(domain);
  }

  /**
   * Método de dominio para activar el programa
   */
  activate(activeFrom?: Date): LoyaltyProgram {
    return new LoyaltyProgram(
      this.id,
      this.tenantId,
      this.name,
      this.description,
      this.programType,
      this.earningDomains,
      this.priorityRank,
      this.stacking,
      this.limits,
      this.expirationPolicy,
      this.currency,
      this.minPointsToRedeem,
      'active',
      this.version,
      activeFrom || this.activeFrom || new Date(),
      this.activeTo,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para desactivar el programa
   */
  deactivate(): LoyaltyProgram {
    return new LoyaltyProgram(
      this.id,
      this.tenantId,
      this.name,
      this.description,
      this.programType,
      this.earningDomains,
      this.priorityRank,
      this.stacking,
      this.limits,
      this.expirationPolicy,
      this.currency,
      this.minPointsToRedeem,
      'inactive',
      this.version,
      this.activeFrom,
      new Date(), // activeTo = ahora
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para crear una nueva versión del programa (inmutabilidad)
   */
  createNewVersion(
    updates: Partial<{
      name: string;
      description: string | null;
      earningDomains: EarningDomain[];
      priorityRank: number;
      stacking: StackingPolicy;
      limits: ProgramLimits | null;
      expirationPolicy: ExpirationPolicy;
      currency: string | null;
      minPointsToRedeem: number;
    }>,
  ): LoyaltyProgram {
    return new LoyaltyProgram(
      this.id, // Mismo ID para nueva versión (o 0 si es completamente nuevo)
      this.tenantId,
      updates.name ?? this.name,
      updates.description ?? this.description,
      this.programType, // programType no cambia entre versiones
      (updates.earningDomains ?? this.earningDomains) as EarningDomainItem[],
      updates.priorityRank ?? this.priorityRank,
      updates.stacking ?? this.stacking,
      updates.limits ?? this.limits,
      updates.expirationPolicy ?? this.expirationPolicy,
      updates.currency ?? this.currency,
      updates.minPointsToRedeem ?? this.minPointsToRedeem,
      this.status,
      this.version + 1, // Incrementar versión
      this.activeFrom,
      this.activeTo,
      this.createdAt,
      new Date(),
    );
  }
}

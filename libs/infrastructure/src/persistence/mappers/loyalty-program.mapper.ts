import {
  LoyaltyProgram,
  EarningDomainItem,
  StackingPolicy,
  ProgramLimits,
  ExpirationPolicy,
} from '@libs/domain';
import { LoyaltyProgramEntity } from '../entities/loyalty-program.entity';
import { LoyaltyProgramEarningDomainEntity } from '../entities/loyalty-program-earning-domain.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 *
 * NOTA: Durante la migración, los campos JSON se mantienen como fallback.
 * Después de validar la migración, se pueden remover los campos JSON.
 */
export class LoyaltyProgramMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   * Usa las nuevas columnas relacionales como fuente de verdad
   */
  static toDomain(persistenceEntity: LoyaltyProgramEntity): LoyaltyProgram {
    // Construir earningDomains desde tabla relacionada (columnas JSON eliminadas)
    const earningDomains: EarningDomainItem[] =
      persistenceEntity.earningDomainsRelation?.length > 0
        ? persistenceEntity.earningDomainsRelation.map((ed) => ({
            domain: ed.domain as any, // Cast a EarningDomain
          }))
        : [];

    // Construir stacking desde columnas directas (columnas JSON eliminadas)
    const stacking: StackingPolicy = {
      allowed: persistenceEntity.stackingAllowed,
      maxProgramsPerEvent: persistenceEntity.stackingMaxProgramsPerEvent ?? undefined,
      maxProgramsPerPeriod: persistenceEntity.stackingMaxProgramsPerPeriod ?? undefined,
      period: persistenceEntity.stackingPeriod ?? undefined,
      selectionStrategy: persistenceEntity.stackingSelectionStrategy ?? undefined,
    };

    // Construir limits desde columnas directas (columnas JSON eliminadas)
    const limits: ProgramLimits | null =
      persistenceEntity.limitMaxPointsPerEvent !== null ||
      persistenceEntity.limitMaxPointsPerDay !== null ||
      persistenceEntity.limitMaxPointsPerMonth !== null ||
      persistenceEntity.limitMaxPointsPerYear !== null
        ? {
            maxPointsPerEvent: persistenceEntity.limitMaxPointsPerEvent ?? undefined,
            maxPointsPerDay: persistenceEntity.limitMaxPointsPerDay ?? undefined,
            maxPointsPerMonth: persistenceEntity.limitMaxPointsPerMonth ?? undefined,
            maxPointsPerYear: persistenceEntity.limitMaxPointsPerYear ?? undefined,
          }
        : null;

    // Construir expirationPolicy desde columnas directas (columnas JSON eliminadas)
    const expirationPolicy: ExpirationPolicy = {
      enabled: persistenceEntity.expirationEnabled,
      type: persistenceEntity.expirationType ?? 'simple', // Valor por defecto si es null
      daysToExpire: persistenceEntity.expirationDaysToExpire ?? undefined,
      gracePeriodDays: persistenceEntity.expirationGracePeriodDays ?? undefined,
    };

    return new LoyaltyProgram(
      persistenceEntity.id,
      persistenceEntity.tenantId,
      persistenceEntity.name,
      persistenceEntity.description,
      persistenceEntity.programType as LoyaltyProgram['programType'],
      earningDomains,
      persistenceEntity.priorityRank,
      stacking,
      limits,
      expirationPolicy,
      persistenceEntity.currency,
      persistenceEntity.minPointsToRedeem,
      persistenceEntity.status as LoyaltyProgram['status'],
      persistenceEntity.version,
      persistenceEntity.activeFrom,
      persistenceEntity.activeTo,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   * Si el ID es 0, no se asigna para que la BD lo genere automáticamente
   *
   * NOTA: Esta función solo actualiza las columnas directas.
   * Las tablas relacionadas (earningDomains) deben manejarse
   * por separado o mediante cascadas configuradas en TypeORM.
   */
  static toPersistence(domainEntity: LoyaltyProgram): Partial<LoyaltyProgramEntity> {
    const entity: Partial<LoyaltyProgramEntity> = {};

    // Solo asignar ID si es mayor a 0 (programa existente)
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }

    entity.tenantId = domainEntity.tenantId;
    entity.name = domainEntity.name;
    entity.description = domainEntity.description;
    entity.programType = domainEntity.programType;
    entity.priorityRank = domainEntity.priorityRank;
    entity.currency = domainEntity.currency;
    entity.minPointsToRedeem = domainEntity.minPointsToRedeem;
    entity.status = domainEntity.status;
    entity.version = domainEntity.version;
    entity.activeFrom = domainEntity.activeFrom;
    entity.activeTo = domainEntity.activeTo;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;

    // Mapear stacking a columnas directas
    entity.stackingAllowed = domainEntity.stacking.allowed;
    entity.stackingMaxProgramsPerEvent = domainEntity.stacking.maxProgramsPerEvent ?? null;
    entity.stackingMaxProgramsPerPeriod = domainEntity.stacking.maxProgramsPerPeriod ?? null;
    entity.stackingPeriod = domainEntity.stacking.period ?? null;
    entity.stackingSelectionStrategy = domainEntity.stacking.selectionStrategy ?? null;

    // Mapear limits a columnas directas
    if (domainEntity.limits) {
      entity.limitMaxPointsPerEvent = domainEntity.limits.maxPointsPerEvent ?? null;
      entity.limitMaxPointsPerDay = domainEntity.limits.maxPointsPerDay ?? null;
      entity.limitMaxPointsPerMonth = domainEntity.limits.maxPointsPerMonth ?? null;
      entity.limitMaxPointsPerYear = domainEntity.limits.maxPointsPerYear ?? null;
    } else {
      entity.limitMaxPointsPerEvent = null;
      entity.limitMaxPointsPerDay = null;
      entity.limitMaxPointsPerMonth = null;
      entity.limitMaxPointsPerYear = null;
    }

    // Mapear expirationPolicy a columnas directas
    entity.expirationEnabled = domainEntity.expirationPolicy.enabled;
    entity.expirationType = domainEntity.expirationPolicy.type ?? null;
    entity.expirationDaysToExpire = domainEntity.expirationPolicy.daysToExpire ?? null;
    entity.expirationGracePeriodDays = domainEntity.expirationPolicy.gracePeriodDays ?? null;

    // Construir relación earningDomainsRelation (columnas JSON eliminadas)
    if (domainEntity.earningDomains && domainEntity.earningDomains.length > 0) {
      const programId = domainEntity.id || 0; // Usar 0 si es nuevo, TypeORM lo actualizará después
      entity.earningDomainsRelation = this.earningDomainsToPersistence(
        domainEntity.earningDomains,
        programId,
      );
    }

    return entity;
  }

  /**
   * Convierte EarningDomainItem[] a LoyaltyProgramEarningDomainEntity[]
   * Usado para crear/actualizar la relación de earning domains
   */
  static earningDomainsToPersistence(
    earningDomains: EarningDomainItem[],
    programId: number,
  ): LoyaltyProgramEarningDomainEntity[] {
    return earningDomains.map((item) => {
      const entity = new LoyaltyProgramEarningDomainEntity();
      entity.programId = programId;
      entity.domain = item.domain;
      return entity;
    });
  }
}

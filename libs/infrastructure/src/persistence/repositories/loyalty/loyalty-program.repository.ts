import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILoyaltyProgramRepository, LoyaltyProgram } from '@libs/domain';
import { LoyaltyProgramEntity } from '@libs/infrastructure/entities/loyalty/loyalty-program.entity';
import { LoyaltyProgramEarningDomainEntity } from '@libs/infrastructure/entities/loyalty/loyalty-program-earning-domain.entity';
import { LoyaltyProgramMapper } from '@libs/infrastructure/mappers/loyalty/loyalty-program.mapper';

/**
 * Implementación del repositorio de LoyaltyProgram usando TypeORM
 *
 * NOTA: Actualizado para usar columnas relacionales en lugar de JSON_CONTAINS.
 * Las relaciones (earningDomains) se cargan con LEFT JOIN cuando es necesario.
 */
@Injectable()
export class LoyaltyProgramRepository implements ILoyaltyProgramRepository {
  constructor(
    @InjectRepository(LoyaltyProgramEntity)
    private readonly loyaltyProgramRepository: Repository<LoyaltyProgramEntity>,
  ) {}

  async save(program: LoyaltyProgram): Promise<LoyaltyProgram> {
    const entity = LoyaltyProgramMapper.toPersistence(program);

    // Si es una actualización (ID > 0), manejar las relaciones manualmente
    if (program.id > 0) {
      // Cargar la entidad existente con sus relaciones
      const existingEntity = await this.loyaltyProgramRepository.findOne({
        where: { id: program.id },
        relations: ['earningDomainsRelation'],
      });

      if (existingEntity) {
        // Sincronizar earningDomainsRelation
        const newDomains = entity.earningDomainsRelation || [];
        const existingDomains = existingEntity.earningDomainsRelation || [];

        // Encontrar los dominios que deben eliminarse (están en BD pero no en el dominio)
        const domainsToDelete = existingDomains.filter(
          (existing) => !newDomains.some((newDomain) => newDomain.domain === existing.domain),
        );

        // Eliminar los que ya no están
        if (domainsToDelete.length > 0) {
          await this.loyaltyProgramRepository.manager.remove(domainsToDelete);
        }

        // Construir la lista final de dominios: reutilizar existentes y crear nuevos
        entity.earningDomainsRelation = newDomains.map((newDomain) => {
          // Buscar si ya existe en la BD
          const existing = existingDomains.find((ed) => ed.domain === newDomain.domain);
          if (existing) {
            return existing; // Reutilizar la entidad existente (evita duplicados)
          }
          // Crear nueva entidad para los que no existen
          const earningDomainEntity = new LoyaltyProgramEarningDomainEntity();
          earningDomainEntity.programId = program.id;
          earningDomainEntity.domain = newDomain.domain;
          return earningDomainEntity;
        });
      }
    }

    const savedEntity = await this.loyaltyProgramRepository.save(entity);

    // Cargar relaciones después de guardar para el mapper
    const entityWithRelations = await this.loyaltyProgramRepository.findOne({
      where: { id: savedEntity.id },
      relations: ['earningDomainsRelation'],
    });

    return LoyaltyProgramMapper.toDomain(entityWithRelations || savedEntity);
  }

  async findById(id: number): Promise<LoyaltyProgram | null> {
    const entity = await this.loyaltyProgramRepository.findOne({
      where: { id },
      relations: ['earningDomainsRelation'],
    });

    if (!entity) {
      return null;
    }

    return LoyaltyProgramMapper.toDomain(entity);
  }

  async findByTenantId(tenantId: number): Promise<LoyaltyProgram[]> {
    const entities = await this.loyaltyProgramRepository.find({
      where: { tenantId },
      relations: ['earningDomainsRelation'],
      order: { priorityRank: 'DESC', createdAt: 'ASC' },
    });

    return entities.map((entity) => LoyaltyProgramMapper.toDomain(entity));
  }

  async findActiveByTenantId(tenantId: number): Promise<LoyaltyProgram[]> {
    const now = new Date();
    const entities = await this.loyaltyProgramRepository
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.earningDomainsRelation', 'earningDomains')
      .where('program.tenantId = :tenantId', { tenantId })
      .andWhere('program.status = :status', { status: 'active' })
      .andWhere('(program.activeFrom IS NULL OR program.activeFrom <= :now)', { now })
      .andWhere('(program.activeTo IS NULL OR program.activeTo >= :now)', { now })
      .orderBy('program.priorityRank', 'DESC')
      .addOrderBy('program.createdAt', 'ASC')
      .getMany();

    return entities.map((entity) => LoyaltyProgramMapper.toDomain(entity));
  }

  async findByTenantIdAndType(
    tenantId: number,
    programType: LoyaltyProgram['programType'],
  ): Promise<LoyaltyProgram[]> {
    const entities = await this.loyaltyProgramRepository.find({
      where: { tenantId, programType },
      relations: ['earningDomainsRelation'],
      order: { priorityRank: 'DESC', createdAt: 'ASC' },
    });

    return entities.map((entity) => LoyaltyProgramMapper.toDomain(entity));
  }

  async findBaseProgramByTenantId(tenantId: number): Promise<LoyaltyProgram | null> {
    const now = new Date();
    const entity = await this.loyaltyProgramRepository
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.earningDomainsRelation', 'earningDomains')
      .where('program.tenantId = :tenantId', { tenantId })
      .andWhere('program.programType = :type', { type: 'BASE' })
      .andWhere('program.status = :status', { status: 'active' })
      .andWhere('(program.activeFrom IS NULL OR program.activeFrom <= :now)', { now })
      .andWhere('(program.activeTo IS NULL OR program.activeTo >= :now)', { now })
      .orderBy('program.priorityRank', 'DESC')
      .limit(1)
      .getOne();

    if (!entity) {
      return null;
    }

    return LoyaltyProgramMapper.toDomain(entity);
  }

  async findByTenantIdAndEarningDomain(
    tenantId: number,
    earningDomain: string,
  ): Promise<LoyaltyProgram[]> {
    const now = new Date();
    const entities = await this.loyaltyProgramRepository
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.earningDomainsRelation', 'earningDomains')
      .where('program.tenantId = :tenantId', { tenantId })
      .andWhere('program.status = :status', { status: 'active' })
      .andWhere('(program.activeFrom IS NULL OR program.activeFrom <= :now)', { now })
      .andWhere('(program.activeTo IS NULL OR program.activeTo >= :now)', { now })
      .andWhere('earningDomains.domain = :domain', { domain: earningDomain })
      .orderBy('program.priorityRank', 'DESC')
      .getMany();

    return entities.map((entity) => LoyaltyProgramMapper.toDomain(entity));
  }

  async hasActiveBaseProgram(tenantId: number): Promise<boolean> {
    const baseProgram = await this.findBaseProgramByTenantId(tenantId);
    return baseProgram !== null;
  }

  async countActiveByTenantId(tenantId: number): Promise<number> {
    const now = new Date();
    return await this.loyaltyProgramRepository
      .createQueryBuilder('program')
      .where('program.tenantId = :tenantId', { tenantId })
      .andWhere('program.status = :status', { status: 'active' })
      .andWhere('(program.activeFrom IS NULL OR program.activeFrom <= :now)', { now })
      .andWhere('(program.activeTo IS NULL OR program.activeTo >= :now)', { now })
      .getCount();
  }

  async delete(id: number): Promise<void> {
    await this.loyaltyProgramRepository.delete(id);
  }
}

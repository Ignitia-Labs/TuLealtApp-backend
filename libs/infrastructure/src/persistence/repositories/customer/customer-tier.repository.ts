import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICustomerTierRepository, CustomerTier } from '@libs/domain';
import { CustomerTierEntity } from '@libs/infrastructure/entities/customer/customer-tier.entity';
import { CustomerTierBenefitEntity } from '@libs/infrastructure/entities/customer/customer-tier-benefit.entity';
import { CustomerTierMapper } from '@libs/infrastructure/mappers/customer/customer-tier.mapper';

/**
 * Implementación del repositorio de CustomerTier usando TypeORM
 *
 * NOTA: Actualizado para usar tablas relacionales en lugar de JSON.
 * Las relaciones (benefits) se cargan con LEFT JOIN cuando es necesario.
 */
@Injectable()
export class CustomerTierRepository implements ICustomerTierRepository {
  constructor(
    @InjectRepository(CustomerTierEntity)
    private readonly customerTierRepository: Repository<CustomerTierEntity>,
  ) {}

  async findById(id: number): Promise<CustomerTier | null> {
    const entity = await this.customerTierRepository.findOne({
      where: { id },
      relations: ['benefitsRelation'],
    });

    if (!entity) {
      return null;
    }

    return CustomerTierMapper.toDomain(entity);
  }

  async findByTenantId(tenantId: number): Promise<CustomerTier[]> {
    const entities = await this.customerTierRepository.find({
      where: { tenantId },
      relations: ['benefitsRelation'],
      order: { priority: 'ASC' },
    });

    return entities.map((entity) => CustomerTierMapper.toDomain(entity));
  }

  async findActiveByTenantId(tenantId: number): Promise<CustomerTier[]> {
    const entities = await this.customerTierRepository.find({
      where: { tenantId, status: 'active' },
      relations: ['benefitsRelation'],
      order: { priority: 'ASC' },
    });

    return entities.map((entity) => CustomerTierMapper.toDomain(entity));
  }

  async findByPoints(tenantId: number, points: number): Promise<CustomerTier | null> {
    const entities = await this.customerTierRepository.find({
      where: { tenantId, status: 'active' },
      relations: ['benefitsRelation'],
      order: { priority: 'ASC' },
    });

    const tiers = entities.map((entity) => CustomerTierMapper.toDomain(entity));
    return tiers.find((tier) => tier.belongsToTier(points)) || null;
  }

  async save(tier: CustomerTier): Promise<CustomerTier> {
    const entity = CustomerTierMapper.toPersistence(tier);

    // Si es una actualización (id > 0), eliminar relaciones existentes solo si se están actualizando
    if (tier.id > 0) {
      const existingEntity = await this.customerTierRepository.findOne({
        where: { id: tier.id },
        relations: ['benefitsRelation'],
      });

      if (existingEntity) {
        // Eliminar benefits existentes solo si vamos a crear nuevos
        // (si entity.benefitsRelation existe y tiene elementos, significa que el mapper la construyó)
        if (existingEntity.benefitsRelation && existingEntity.benefitsRelation.length > 0) {
          if (entity.benefitsRelation && entity.benefitsRelation.length > 0) {
            // Eliminar todos los benefits antiguos antes de crear nuevos
            await this.customerTierRepository.manager.delete(
              CustomerTierBenefitEntity,
              existingEntity.benefitsRelation.map((b) => b.id),
            );
          }
          // Si no vamos a crear nuevos pero existen antiguos, eliminarlos (caso de eliminación explícita)
          else if (!entity.benefitsRelation || entity.benefitsRelation.length === 0) {
            await this.customerTierRepository.manager.delete(
              CustomerTierBenefitEntity,
              existingEntity.benefitsRelation.map((b) => b.id),
            );
          }
        }
      }
    }

    // Guardar la entidad principal con sus relaciones
    // TypeORM guardará automáticamente las relaciones OneToMany con cascade: true
    const savedEntity = await this.customerTierRepository.save(entity);

    // Cargar relaciones después de guardar para el mapper
    const entityWithRelations = await this.customerTierRepository.findOne({
      where: { id: savedEntity.id },
      relations: ['benefitsRelation'],
    });

    return CustomerTierMapper.toDomain(entityWithRelations || savedEntity);
  }

  async update(tier: CustomerTier): Promise<CustomerTier> {
    const entity = CustomerTierMapper.toPersistence(tier);

    // Si es una actualización (id > 0), eliminar relaciones existentes solo si se están actualizando
    if (tier.id > 0) {
      const existingEntity = await this.customerTierRepository.findOne({
        where: { id: tier.id },
        relations: ['benefitsRelation'],
      });

      if (existingEntity) {
        // Eliminar benefits existentes solo si vamos a crear nuevos
        // (si entity.benefitsRelation existe y tiene elementos, significa que el mapper la construyó)
        if (existingEntity.benefitsRelation && existingEntity.benefitsRelation.length > 0) {
          if (entity.benefitsRelation && entity.benefitsRelation.length > 0) {
            // Eliminar todos los benefits antiguos antes de crear nuevos
            await this.customerTierRepository.manager.delete(
              CustomerTierBenefitEntity,
              existingEntity.benefitsRelation.map((b) => b.id),
            );
          }
          // Si no vamos a crear nuevos pero existen antiguos, eliminarlos (caso de eliminación explícita)
          else if (!entity.benefitsRelation || entity.benefitsRelation.length === 0) {
            await this.customerTierRepository.manager.delete(
              CustomerTierBenefitEntity,
              existingEntity.benefitsRelation.map((b) => b.id),
            );
          }
        }
      }
    }

    // Guardar la entidad principal con sus relaciones
    // TypeORM guardará automáticamente las relaciones OneToMany con cascade: true
    const updatedEntity = await this.customerTierRepository.save(entity);

    // Cargar relaciones después de actualizar para el mapper
    const entityWithRelations = await this.customerTierRepository.findOne({
      where: { id: updatedEntity.id },
      relations: ['benefitsRelation'],
    });

    return CustomerTierMapper.toDomain(entityWithRelations || updatedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.customerTierRepository.delete(id);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, QueryFailedError } from 'typeorm';
import { ITenantAnalyticsRepository, TenantAnalytics } from '@libs/domain';
import { TenantAnalyticsEntity } from '@libs/infrastructure/entities/system/tenant-analytics.entity';
import { TenantAnalyticsMapper } from '@libs/infrastructure/mappers/system/tenant-analytics.mapper';

/**
 * Implementación del repositorio de TenantAnalytics usando TypeORM
 */
@Injectable()
export class TenantAnalyticsRepository implements ITenantAnalyticsRepository {
  constructor(
    @InjectRepository(TenantAnalyticsEntity)
    private readonly analyticsRepository: Repository<TenantAnalyticsEntity>,
  ) {}

  async findByTenantId(tenantId: number): Promise<TenantAnalytics | null> {
    const entity = await this.analyticsRepository.findOne({
      where: { tenantId },
    });

    if (!entity) {
      return null;
    }

    return TenantAnalyticsMapper.toDomain(entity);
  }

  async saveOrUpdate(
    tenantId: number,
    analytics: TenantAnalytics,
    metadata?: { calculationDurationMs?: number },
  ): Promise<TenantAnalytics> {
    // Convertir a datos de persistencia
    const analyticsData = TenantAnalyticsMapper.toPersistence(analytics);

    // Si existe metadata de duración, agregarla
    if (metadata?.calculationDurationMs !== undefined) {
      analyticsData.calculationDurationMs = metadata.calculationDurationMs;
    }

    // ESTRATEGIA: Intentar UPDATE primero (más común y seguro)
    // Si no existe, entonces INSERT
    const existingEntity = await this.analyticsRepository.findOne({
      where: { tenantId },
    });

    if (existingEntity) {
      // ACTUALIZAR registro existente
      // Excluir campos que no deben actualizarse
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, ...updateData } = analyticsData;

      // Actualizar campos
      Object.assign(existingEntity, updateData);
      existingEntity.tenantId = tenantId; // Asegurar que tenantId no cambie

      // Guardar cambios
      const savedEntity = await this.analyticsRepository.save(existingEntity);
      return TenantAnalyticsMapper.toDomain(savedEntity);
    }

    // CREAR nuevo registro (solo si no existe)
    // Excluir id, createdAt, updatedAt para que se generen automáticamente
    const newEntityData = { ...analyticsData };
    delete newEntityData.id;
    delete newEntityData.createdAt;
    delete newEntityData.updatedAt;

    const newEntity = this.analyticsRepository.create({
      ...newEntityData,
      tenantId, // Asegurar que tenantId esté presente
    });

    try {
      const savedEntity = await this.analyticsRepository.save(newEntity);
      return TenantAnalyticsMapper.toDomain(savedEntity);
    } catch (error: any) {
      // Manejar condición de carrera: si otro proceso creó el registro mientras intentábamos crearlo
      const isDuplicateError =
        error instanceof QueryFailedError ||
        error?.code === 'ER_DUP_ENTRY' ||
        error?.errno === 1062 ||
        error?.driverError?.code === 'ER_DUP_ENTRY' ||
        error?.driverError?.errno === 1062;

      if (isDuplicateError) {
        // Buscar el registro que fue creado por otro proceso
        const retryEntity = await this.analyticsRepository.findOne({
          where: { tenantId },
        });

        if (retryEntity) {
          // Actualizar el registro existente con los nuevos datos
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: __id, createdAt: __createdAt, ...updateData } = analyticsData;
          Object.assign(retryEntity, updateData);
          retryEntity.tenantId = tenantId;

          const savedEntity = await this.analyticsRepository.save(retryEntity);
          return TenantAnalyticsMapper.toDomain(savedEntity);
        }
      }

      // Si no es error de duplicado o no encontramos el registro, relanzar el error
      throw error;
    }
  }

  async delete(tenantId: number): Promise<void> {
    await this.analyticsRepository.delete({ tenantId });
  }

  async findTenantsNeedingUpdate(olderThanHours: number): Promise<number[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

    const entities = await this.analyticsRepository.find({
      where: {
        lastCalculatedAt: LessThan(cutoffDate),
      },
      select: ['tenantId'],
    });

    return entities.map((e) => e.tenantId);
  }
}

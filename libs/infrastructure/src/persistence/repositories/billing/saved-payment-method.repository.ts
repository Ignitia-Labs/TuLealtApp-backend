import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISavedPaymentMethodRepository, SavedPaymentMethod } from '@libs/domain';
import { SavedPaymentMethodEntity } from '@libs/infrastructure/entities/billing/saved-payment-method.entity';
import { SavedPaymentMethodMapper } from '@libs/infrastructure/mappers/billing/saved-payment-method.mapper';

/**
 * Implementación del repositorio de SavedPaymentMethod usando TypeORM
 */
@Injectable()
export class SavedPaymentMethodRepository implements ISavedPaymentMethodRepository {
  constructor(
    @InjectRepository(SavedPaymentMethodEntity)
    private readonly savedPaymentMethodRepository: Repository<SavedPaymentMethodEntity>,
  ) {}

  async findById(id: number): Promise<SavedPaymentMethod | null> {
    const entity = await this.savedPaymentMethodRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return SavedPaymentMethodMapper.toDomain(entity);
  }

  async findByPartnerId(partnerId: number): Promise<SavedPaymentMethod[]> {
    const entities = await this.savedPaymentMethodRepository.find({
      where: { partnerId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });

    return entities.map((entity) => SavedPaymentMethodMapper.toDomain(entity));
  }

  async findActiveByPartnerId(partnerId: number): Promise<SavedPaymentMethod[]> {
    const entities = await this.savedPaymentMethodRepository.find({
      where: { partnerId, isActive: true },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });

    return entities.map((entity) => SavedPaymentMethodMapper.toDomain(entity));
  }

  async findDefaultByPartnerId(partnerId: number): Promise<SavedPaymentMethod | null> {
    const entity = await this.savedPaymentMethodRepository.findOne({
      where: { partnerId, isDefault: true, isActive: true },
    });

    if (!entity) {
      return null;
    }

    return SavedPaymentMethodMapper.toDomain(entity);
  }

  async save(method: SavedPaymentMethod): Promise<SavedPaymentMethod> {
    const entity = SavedPaymentMethodMapper.toPersistence(method);
    const savedEntity = await this.savedPaymentMethodRepository.save(entity);
    return SavedPaymentMethodMapper.toDomain(savedEntity);
  }

  async update(method: SavedPaymentMethod): Promise<SavedPaymentMethod> {
    const entity = SavedPaymentMethodMapper.toPersistence(method);
    const updatedEntity = await this.savedPaymentMethodRepository.save(entity);
    return SavedPaymentMethodMapper.toDomain(updatedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.savedPaymentMethodRepository.delete(id);
  }
}

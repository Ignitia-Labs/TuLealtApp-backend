import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRateExchangeRepository, RateExchange } from '@libs/domain';
import { RateExchangeEntity } from '../entities/rate-exchange.entity';
import { RateExchangeMapper } from '../mappers/rate-exchange.mapper';

/**
 * Implementación del repositorio de tipo de cambio usando TypeORM
 */
@Injectable()
export class RateExchangeRepository implements IRateExchangeRepository {
  constructor(
    @InjectRepository(RateExchangeEntity)
    private readonly rateExchangeRepository: Repository<RateExchangeEntity>,
  ) {}

  async getCurrent(): Promise<RateExchange | null> {
    try {
      // Obtener el registro más reciente ordenado por updatedAt descendente
      const entities = await this.rateExchangeRepository.find({
        order: {
          updatedAt: 'DESC',
        },
        take: 1,
      });

      if (!entities || entities.length === 0) {
        return null;
      }

      return RateExchangeMapper.toDomain(entities[0]);
    } catch (error) {
      console.error('Error getting rate exchange:', error);
      throw error;
    }
  }

  async setRate(rate: number): Promise<RateExchange> {
    try {
      // Obtener el registro actual (el más reciente)
      const entities = await this.rateExchangeRepository.find({
        order: {
          updatedAt: 'DESC',
        },
        take: 1,
      });

      if (entities && entities.length > 0) {
        // Actualizar el registro existente
        const currentEntity = entities[0];
        currentEntity.rate = rate;
        currentEntity.updatedAt = new Date();
        const updatedEntity = await this.rateExchangeRepository.save(currentEntity);
        return RateExchangeMapper.toDomain(updatedEntity);
      } else {
        // Crear un nuevo registro
        const newRateExchange = RateExchange.create(rate);
        const entity = RateExchangeMapper.toPersistence(newRateExchange);
        const savedEntity = await this.rateExchangeRepository.save(entity);
        return RateExchangeMapper.toDomain(savedEntity);
      }
    } catch (error) {
      console.error('Error setting rate exchange:', error);
      throw error;
    }
  }
}

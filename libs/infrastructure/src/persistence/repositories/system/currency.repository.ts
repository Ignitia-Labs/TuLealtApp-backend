import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICurrencyRepository, Currency } from '@libs/domain';
import { CurrencyEntity } from '@libs/infrastructure/entities/system/currency.entity';
import { CurrencyMapper } from '@libs/infrastructure/mappers/system/currency.mapper';

/**
 * Implementación del repositorio de currencies usando TypeORM
 */
@Injectable()
export class CurrencyRepository implements ICurrencyRepository {
  constructor(
    @InjectRepository(CurrencyEntity)
    private readonly currencyRepository: Repository<CurrencyEntity>,
  ) {}

  async save(currency: Currency): Promise<Currency> {
    const currencyEntity = CurrencyMapper.toPersistence(currency);
    const savedEntity = await this.currencyRepository.save(currencyEntity);
    return CurrencyMapper.toDomain(savedEntity);
  }

  async findById(id: number): Promise<Currency | null> {
    const currencyEntity = await this.currencyRepository.findOne({
      where: { id },
    });

    if (!currencyEntity) {
      return null;
    }

    return CurrencyMapper.toDomain(currencyEntity);
  }

  async findByCode(code: string): Promise<Currency | null> {
    const currencyEntity = await this.currencyRepository.findOne({
      where: { code },
    });

    if (!currencyEntity) {
      return null;
    }

    return CurrencyMapper.toDomain(currencyEntity);
  }

  async findAllActive(): Promise<Currency[]> {
    const currencyEntities = await this.currencyRepository.find({
      where: { status: 'active' },
      order: {
        code: 'ASC',
      },
    });

    return currencyEntities.map((entity) => CurrencyMapper.toDomain(entity));
  }

  async findAll(): Promise<Currency[]> {
    const currencyEntities = await this.currencyRepository.find({
      order: {
        code: 'ASC',
      },
    });

    return currencyEntities.map((entity) => CurrencyMapper.toDomain(entity));
  }
}

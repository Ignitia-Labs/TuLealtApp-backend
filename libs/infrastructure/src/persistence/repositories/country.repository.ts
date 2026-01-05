import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICountryRepository, Country } from '@libs/domain';
import { CountryEntity } from '../entities/country.entity';
import { CountryMapper } from '../mappers/country.mapper';

/**
 * Implementación del repositorio de countries usando TypeORM
 */
@Injectable()
export class CountryRepository implements ICountryRepository {
  constructor(
    @InjectRepository(CountryEntity)
    private readonly countryRepository: Repository<CountryEntity>,
  ) {}

  async save(country: Country): Promise<Country> {
    const countryEntity = CountryMapper.toPersistence(country);
    const savedEntity = await this.countryRepository.save(countryEntity);
    return CountryMapper.toDomain(savedEntity);
  }

  async findById(id: number): Promise<Country | null> {
    const countryEntity = await this.countryRepository.findOne({
      where: { id },
    });

    if (!countryEntity) {
      return null;
    }

    return CountryMapper.toDomain(countryEntity);
  }

  async findByCode(code: string): Promise<Country | null> {
    const countryEntity = await this.countryRepository.findOne({
      where: { code },
    });

    if (!countryEntity) {
      return null;
    }

    return CountryMapper.toDomain(countryEntity);
  }

  async findByCurrencyCode(currencyCode: string): Promise<Country[]> {
    const countryEntities = await this.countryRepository.find({
      where: { currencyCode },
      order: {
        name: 'ASC',
      },
    });

    return countryEntities.map((entity) => CountryMapper.toDomain(entity));
  }

  async findAllActive(): Promise<Country[]> {
    const countryEntities = await this.countryRepository.find({
      where: { status: 'active' },
      order: {
        name: 'ASC',
      },
    });

    return countryEntities.map((entity) => CountryMapper.toDomain(entity));
  }

  async findAll(): Promise<Country[]> {
    const countryEntities = await this.countryRepository.find({
      order: {
        name: 'ASC',
      },
    });

    return countryEntities.map((entity) => CountryMapper.toDomain(entity));
  }
}

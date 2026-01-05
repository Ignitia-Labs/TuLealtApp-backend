import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICatalogRepository, Catalog, CatalogType } from '@libs/domain';
import { CatalogEntity } from '../entities/catalog.entity';
import { CatalogMapper } from '../mappers/catalog.mapper';

/**
 * Implementación del repositorio de catalogs usando TypeORM
 */
@Injectable()
export class CatalogRepository implements ICatalogRepository {
  constructor(
    @InjectRepository(CatalogEntity)
    private readonly catalogRepository: Repository<CatalogEntity>,
  ) {}

  async save(catalog: Catalog): Promise<Catalog> {
    const catalogEntity = CatalogMapper.toPersistence(catalog);
    const savedEntity = await this.catalogRepository.save(catalogEntity);
    return CatalogMapper.toDomain(savedEntity);
  }

  async update(catalog: Catalog): Promise<Catalog> {
    const catalogEntity = CatalogMapper.toPersistence(catalog);
    const updatedEntity = await this.catalogRepository.save(catalogEntity);
    return CatalogMapper.toDomain(updatedEntity);
  }

  async findById(id: number): Promise<Catalog | null> {
    const catalogEntity = await this.catalogRepository.findOne({
      where: { id },
    });

    if (!catalogEntity) {
      return null;
    }

    return CatalogMapper.toDomain(catalogEntity);
  }

  async findByType(type: CatalogType, includeInactive: boolean = false): Promise<Catalog[]> {
    const where: any = { type };
    if (!includeInactive) {
      where.isActive = true;
    }

    const catalogEntities = await this.catalogRepository.find({
      where,
      order: {
        displayOrder: 'ASC',
        value: 'ASC',
      },
    });

    return catalogEntities.map((entity) => CatalogMapper.toDomain(entity));
  }

  async findByTypeAndValue(type: CatalogType, value: string): Promise<Catalog | null> {
    const catalogEntity = await this.catalogRepository.findOne({
      where: { type, value },
    });

    if (!catalogEntity) {
      return null;
    }

    return CatalogMapper.toDomain(catalogEntity);
  }

  async findBySlug(slug: string): Promise<Catalog | null> {
    const catalogEntity = await this.catalogRepository.findOne({
      where: { slug },
    });

    if (!catalogEntity) {
      return null;
    }

    return CatalogMapper.toDomain(catalogEntity);
  }

  async findByTypeAndSlug(type: CatalogType, slug: string): Promise<Catalog | null> {
    const catalogEntity = await this.catalogRepository.findOne({
      where: { type, slug },
    });

    if (!catalogEntity) {
      return null;
    }

    return CatalogMapper.toDomain(catalogEntity);
  }

  async findAll(includeInactive: boolean = false): Promise<Catalog[]> {
    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    const catalogEntities = await this.catalogRepository.find({
      where,
      order: {
        type: 'ASC',
        displayOrder: 'ASC',
        value: 'ASC',
      },
    });

    return catalogEntities.map((entity) => CatalogMapper.toDomain(entity));
  }

  async delete(id: number): Promise<void> {
    await this.catalogRepository.delete(id);
  }
}

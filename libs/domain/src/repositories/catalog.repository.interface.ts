import { Catalog, CatalogType } from '../entities/catalog.entity';

/**
 * Interfaz del repositorio de Catalog
 * Define los contratos para persistir y recuperar elementos de catálogo
 */
export interface ICatalogRepository {
  /**
   * Guarda un nuevo elemento de catálogo o actualiza uno existente
   */
  save(catalog: Catalog): Promise<Catalog>;

  /**
   * Actualiza un elemento de catálogo existente
   */
  update(catalog: Catalog): Promise<Catalog>;

  /**
   * Busca un elemento de catálogo por su ID
   */
  findById(id: number): Promise<Catalog | null>;

  /**
   * Busca elementos de catálogo por tipo
   */
  findByType(type: CatalogType, includeInactive?: boolean): Promise<Catalog[]>;

  /**
   * Busca un elemento de catálogo por tipo y valor
   */
  findByTypeAndValue(type: CatalogType, value: string): Promise<Catalog | null>;

  /**
   * Busca un elemento de catálogo por slug
   */
  findBySlug(slug: string): Promise<Catalog | null>;

  /**
   * Busca un elemento de catálogo por tipo y slug
   */
  findByTypeAndSlug(type: CatalogType, slug: string): Promise<Catalog | null>;

  /**
   * Obtiene todos los elementos de catálogo
   */
  findAll(includeInactive?: boolean): Promise<Catalog[]>;

  /**
   * Elimina un elemento de catálogo por su ID
   */
  delete(id: number): Promise<void>;
}


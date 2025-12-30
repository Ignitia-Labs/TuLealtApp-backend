/**
 * Entidad de dominio MessageFilter
 * Representa los criterios de filtrado para mensajes tipo 'filtered'
 * No depende de frameworks ni librerías externas
 */
export type FilterType =
  | 'plan'
  | 'country'
  | 'status'
  | 'date_range'
  | 'category'
  | 'custom';

export class MessageFilter {
  constructor(
    public readonly id: number,
    public readonly messageId: number,
    public readonly filterType: FilterType,
    public readonly filterValue: Record<string, any>,
    public readonly createdAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo filtro
   */
  static create(
    messageId: number,
    filterType: FilterType,
    filterValue: Record<string, any>,
    id?: number,
  ): MessageFilter {
    const now = new Date();
    return new MessageFilter(id || 0, messageId, filterType, filterValue, now);
  }
}


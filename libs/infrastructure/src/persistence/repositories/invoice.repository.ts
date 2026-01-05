import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IInvoiceRepository, Invoice } from '@libs/domain';
import { InvoiceEntity } from '../entities/invoice.entity';
import { InvoiceMapper } from '../mappers/invoice.mapper';

/**
 * Implementación del repositorio de Invoice usando TypeORM
 */
@Injectable()
export class InvoiceRepository implements IInvoiceRepository {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepository: Repository<InvoiceEntity>,
  ) {}

  async findById(id: number): Promise<Invoice | null> {
    const entity = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!entity) {
      return null;
    }

    return InvoiceMapper.toDomain(entity);
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    const entity = await this.invoiceRepository.findOne({
      where: { invoiceNumber },
      relations: ['items'],
    });

    if (!entity) {
      return null;
    }

    return InvoiceMapper.toDomain(entity);
  }

  async findBySubscriptionId(subscriptionId: number): Promise<Invoice[]> {
    const entities = await this.invoiceRepository.find({
      where: { subscriptionId },
      relations: ['items'],
      order: { issueDate: 'DESC' },
    });

    return entities.map((entity) => InvoiceMapper.toDomain(entity));
  }

  async findByPartnerId(partnerId: number, skip = 0, take = 100): Promise<Invoice[]> {
    const entities = await this.invoiceRepository.find({
      where: { partnerId },
      relations: ['items'],
      skip,
      take,
      order: { issueDate: 'DESC' },
    });

    return entities.map((entity) => InvoiceMapper.toDomain(entity));
  }

  async findPendingByPartnerId(partnerId: number): Promise<Invoice[]> {
    const entities = await this.invoiceRepository.find({
      where: {
        partnerId,
        status: 'pending',
      },
      relations: ['items'],
      order: { dueDate: 'ASC' },
    });

    return entities.map((entity) => InvoiceMapper.toDomain(entity));
  }

  async findByBillingCycleId(billingCycleId: number): Promise<Invoice | null> {
    const entity = await this.invoiceRepository.findOne({
      where: { billingCycleId },
      relations: ['items'],
    });

    if (!entity) {
      return null;
    }

    return InvoiceMapper.toDomain(entity);
  }

  async save(invoice: Invoice): Promise<Invoice> {
    const entity = InvoiceMapper.toPersistence(invoice);
    const savedEntity = await this.invoiceRepository.save(entity);
    return InvoiceMapper.toDomain(savedEntity);
  }

  async update(invoice: Invoice): Promise<Invoice> {
    // Cargar la entidad existente con sus items para preservarlos
    const existingEntity = await this.invoiceRepository.findOne({
      where: { id: invoice.id },
      relations: ['items'],
    });

    if (!existingEntity) {
      throw new Error(`Invoice with ID ${invoice.id} not found`);
    }

    // Convertir la entidad de dominio a persistencia
    const entity = InvoiceMapper.toPersistence(invoice);

    // Preservar los IDs de los items existentes si coinciden por itemId
    // Esto evita que TypeORM intente crear nuevos items o actualizar items sin invoiceId
    if (existingEntity.items && existingEntity.items.length > 0 && entity.items) {
      entity.items = entity.items.map((newItem) => {
        // Buscar el item existente por itemId
        const existingItem = existingEntity.items.find((item) => item.itemId === newItem.itemId);
        if (existingItem) {
          // Preservar el ID y el invoiceId del item existente
          newItem.id = existingItem.id;
          newItem.invoiceId = existingItem.invoiceId;
          // También preservar createdAt si existe
          if (existingItem.createdAt) {
            newItem.createdAt = existingItem.createdAt;
          }
        } else {
          // Si es un item nuevo, asegurar que tenga invoiceId
          newItem.invoiceId = invoice.id;
        }
        return newItem;
      });
    } else if (entity.items && entity.items.length > 0) {
      // Si no hay items existentes pero hay items nuevos, asegurar que tengan invoiceId
      entity.items.forEach((item) => {
        if (!item.invoiceId) {
          item.invoiceId = invoice.id;
        }
      });
    }

    const updatedEntity = await this.invoiceRepository.save(entity);
    return InvoiceMapper.toDomain(updatedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.invoiceRepository.delete(id);
  }
}

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

  async save(invoice: Invoice): Promise<Invoice> {
    const entity = InvoiceMapper.toPersistence(invoice);
    const savedEntity = await this.invoiceRepository.save(entity);
    return InvoiceMapper.toDomain(savedEntity);
  }

  async update(invoice: Invoice): Promise<Invoice> {
    const entity = InvoiceMapper.toPersistence(invoice);
    const updatedEntity = await this.invoiceRepository.save(entity);
    return InvoiceMapper.toDomain(updatedEntity);
  }
}

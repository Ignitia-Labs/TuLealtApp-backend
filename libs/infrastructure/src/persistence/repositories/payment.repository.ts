import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPaymentRepository, Payment } from '@libs/domain';
import { PaymentEntity } from '../entities/payment.entity';
import { PaymentMapper } from '../mappers/payment.mapper';

/**
 * Implementación del repositorio de Payment usando TypeORM
 */
@Injectable()
export class PaymentRepository implements IPaymentRepository {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
  ) {}

  async findById(id: number): Promise<Payment | null> {
    const entity = await this.paymentRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return PaymentMapper.toDomain(entity);
  }

  async findBySubscriptionId(subscriptionId: number): Promise<Payment[]> {
    const entities = await this.paymentRepository.find({
      where: { subscriptionId },
      order: { paymentDate: 'DESC' },
    });

    return entities.map((entity) => PaymentMapper.toDomain(entity));
  }

  async findByPartnerId(partnerId: number, skip = 0, take = 100): Promise<Payment[]> {
    const entities = await this.paymentRepository.find({
      where: { partnerId },
      skip,
      take,
      order: { paymentDate: 'DESC' },
    });

    return entities.map((entity) => PaymentMapper.toDomain(entity));
  }

  async findByInvoiceId(invoiceId: number): Promise<Payment[]> {
    const entities = await this.paymentRepository.find({
      where: { invoiceId },
      order: { paymentDate: 'DESC' },
    });

    return entities.map((entity) => PaymentMapper.toDomain(entity));
  }

  async findByStatus(
    partnerId: number,
    status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled',
  ): Promise<Payment[]> {
    const entities = await this.paymentRepository.find({
      where: { partnerId, status },
      order: { paymentDate: 'DESC' },
    });

    return entities.map((entity) => PaymentMapper.toDomain(entity));
  }

  async save(payment: Payment): Promise<Payment> {
    const entity = PaymentMapper.toPersistence(payment);
    const savedEntity = await this.paymentRepository.save(entity);
    return PaymentMapper.toDomain(savedEntity);
  }

  async update(payment: Payment): Promise<Payment> {
    const entity = PaymentMapper.toPersistence(payment);
    const updatedEntity = await this.paymentRepository.save(entity);
    return PaymentMapper.toDomain(updatedEntity);
  }
}

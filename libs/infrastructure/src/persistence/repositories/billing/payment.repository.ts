import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPaymentRepository, Payment } from '@libs/domain';
import { PaymentEntity } from '@libs/infrastructure/entities/billing/payment.entity';
import { PaymentMapper } from '@libs/infrastructure/mappers/billing/payment.mapper';

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

  async findByPartnerId(
    partnerId: number,
    status?:
      | 'pending'
      | 'pending_validation'
      | 'validated'
      | 'rejected'
      | 'paid'
      | 'failed'
      | 'refunded'
      | 'cancelled',
    page: number | null = 1,
    limit: number | null = 100,
    includeDerived = false,
  ): Promise<Payment[]> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.partnerId = :partnerId', { partnerId });

    // Filtrar por status si se proporciona
    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    // Excluir pagos derivados por defecto
    if (!includeDerived) {
      queryBuilder.andWhere('(payment.originalPaymentId IS NULL OR payment.originalPaymentId = 0)');
    }

    // Aplicar paginación solo si page y limit no son null
    if (page !== null && limit !== null) {
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);
    }

    queryBuilder.orderBy('payment.paymentDate', 'DESC');

    const entities = await queryBuilder.getMany();
    return entities.map((entity) => PaymentMapper.toDomain(entity));
  }

  async countByPartnerId(
    partnerId: number,
    status?:
      | 'pending'
      | 'pending_validation'
      | 'validated'
      | 'rejected'
      | 'paid'
      | 'failed'
      | 'refunded'
      | 'cancelled',
  ): Promise<number> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.partnerId = :partnerId', { partnerId })
      .andWhere('(payment.originalPaymentId IS NULL OR payment.originalPaymentId = 0)'); // Solo originales

    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    return queryBuilder.getCount();
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
    status:
      | 'pending'
      | 'pending_validation'
      | 'validated'
      | 'rejected'
      | 'paid'
      | 'failed'
      | 'refunded'
      | 'cancelled',
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

  async findUnassignedBySubscriptionId(
    subscriptionId: number,
    currency?: string,
  ): Promise<Payment[]> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.subscriptionId = :subscriptionId', { subscriptionId })
      .andWhere('payment.billingCycleId IS NULL')
      .andWhere('payment.status = :status', { status: 'paid' })
      .andWhere('(payment.originalPaymentId IS NULL OR payment.originalPaymentId = 0)'); // Solo payments originales

    if (currency) {
      queryBuilder.andWhere('payment.currency = :currency', { currency });
    }

    queryBuilder.orderBy('payment.paymentDate', 'ASC'); // FIFO: más antiguos primero

    const entities = await queryBuilder.getMany();

    return entities.map((entity) => PaymentMapper.toDomain(entity));
  }

  async findByBillingCycleId(billingCycleId: number): Promise<Payment[]> {
    const entities = await this.paymentRepository.find({
      where: { billingCycleId },
      order: { paymentDate: 'ASC' },
    });

    return entities.map((entity) => PaymentMapper.toDomain(entity));
  }

  async findByTransactionId(transactionId: number): Promise<Payment | null> {
    const entity = await this.paymentRepository.findOne({
      where: { transactionId },
    });

    if (!entity) {
      return null;
    }

    return PaymentMapper.toDomain(entity);
  }

  /**
   * Obtiene el siguiente transactionId disponible (máximo + 1)
   */
  async getNextTransactionId(): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('MAX(payment.transactionId)', 'maxId')
      .getRawOne();

    const maxId = result?.maxId || 0;
    return maxId + 1;
  }

  async delete(id: number): Promise<void> {
    await this.paymentRepository.delete(id);
  }

  async findDerivedByOriginalPaymentId(originalPaymentId: number): Promise<Payment[]> {
    const entities = await this.paymentRepository.find({
      where: { originalPaymentId },
      order: { createdAt: 'ASC' },
    });

    return entities.map((entity) => PaymentMapper.toDomain(entity));
  }

  async findByReference(reference: string): Promise<Payment | null> {
    if (!reference) return null;

    const entity = await this.paymentRepository.findOne({
      where: { reference },
    });

    if (!entity) return null;
    return PaymentMapper.toDomain(entity);
  }

  async findPendingValidationByPartnerId(partnerId: number): Promise<Payment[]> {
    const entities = await this.paymentRepository.find({
      where: {
        partnerId,
        status: 'pending_validation',
        originalPaymentId: null,
      },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => PaymentMapper.toDomain(entity));
  }

  async findRejectedByPartnerId(partnerId: number): Promise<Payment[]> {
    const entities = await this.paymentRepository.find({
      where: {
        partnerId,
        status: 'rejected',
        originalPaymentId: null,
      },
      order: { rejectedAt: 'DESC' },
    });

    return entities.map((entity) => PaymentMapper.toDomain(entity));
  }
}

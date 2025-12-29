import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ITransactionRepository, Transaction } from '@libs/domain';
import { TransactionEntity } from '../entities/transaction.entity';
import { TransactionMapper } from '../mappers/transaction.mapper';

/**
 * Implementación del repositorio de Transaction usando TypeORM
 */
@Injectable()
export class TransactionRepository implements ITransactionRepository {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
  ) {}

  async findById(id: number): Promise<Transaction | null> {
    const entity = await this.transactionRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return TransactionMapper.toDomain(entity);
  }

  async findByUserId(userId: number, skip = 0, take = 100): Promise<Transaction[]> {
    const entities = await this.transactionRepository.find({
      where: { userId },
      skip,
      take,
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => TransactionMapper.toDomain(entity));
  }

  async findByMembershipId(membershipId: number, skip = 0, take = 100): Promise<Transaction[]> {
    const entities = await this.transactionRepository.find({
      where: { membershipId },
      skip,
      take,
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => TransactionMapper.toDomain(entity));
  }

  async findByType(
    userId: number,
    type: 'earn' | 'redeem' | 'expire' | 'adjust',
  ): Promise<Transaction[]> {
    const entities = await this.transactionRepository.find({
      where: { userId, type },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => TransactionMapper.toDomain(entity));
  }

  async findByTypeAndMembershipId(
    membershipId: number,
    type: 'earn' | 'redeem' | 'expire' | 'adjust',
  ): Promise<Transaction[]> {
    const entities = await this.transactionRepository.find({
      where: { membershipId, type },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => TransactionMapper.toDomain(entity));
  }

  async save(transaction: Transaction): Promise<Transaction> {
    const entity = TransactionMapper.toPersistence(transaction);
    const savedEntity = await this.transactionRepository.save(entity);
    return TransactionMapper.toDomain(savedEntity);
  }

  async countByUserId(userId: number): Promise<number> {
    return this.transactionRepository.count({
      where: { userId },
    });
  }
}

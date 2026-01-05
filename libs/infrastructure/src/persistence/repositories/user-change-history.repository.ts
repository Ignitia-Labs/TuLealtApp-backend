import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserChangeHistoryRepository, UserChangeHistory } from '@libs/domain';
import { UserChangeHistoryEntity } from '../entities/user-change-history.entity';
import { UserChangeHistoryMapper } from '../mappers/user-change-history.mapper';

/**
 * Implementación del repositorio de historial de cambios de usuarios usando TypeORM
 */
@Injectable()
export class UserChangeHistoryRepository implements IUserChangeHistoryRepository {
  constructor(
    @InjectRepository(UserChangeHistoryEntity)
    private readonly historyRepository: Repository<UserChangeHistoryEntity>,
  ) {}

  async save(history: UserChangeHistory): Promise<UserChangeHistory> {
    const entity = UserChangeHistoryMapper.toPersistence(history);
    const savedEntity = await this.historyRepository.save(entity);
    return UserChangeHistoryMapper.toDomain(savedEntity);
  }

  async findByUserId(userId: number, skip = 0, take = 100): Promise<UserChangeHistory[]> {
    const entities = await this.historyRepository.find({
      where: { userId },
      skip,
      take,
      order: {
        createdAt: 'DESC',
      },
    });

    return entities.map((entity) => UserChangeHistoryMapper.toDomain(entity));
  }

  async countByUserId(userId: number): Promise<number> {
    return this.historyRepository.count({
      where: { userId },
    });
  }
}

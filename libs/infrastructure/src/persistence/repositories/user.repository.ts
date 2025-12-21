import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository, User } from '@libs/domain';
import { UserEntity } from '../entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';

/**
 * Implementación del repositorio de usuarios usando TypeORM
 */
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findById(id: number): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({
      where: { id },
    });

    if (!userEntity) {
      return null;
    }

    return UserMapper.toDomain(userEntity);
  }

  async findByEmail(email: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({
      where: { email },
    });

    if (!userEntity) {
      return null;
    }

    return UserMapper.toDomain(userEntity);
  }

  async findAll(skip = 0, take = 100): Promise<User[]> {
    const userEntities = await this.userRepository.find({
      skip,
      take,
      order: {
        createdAt: 'DESC',
      },
    });

    return userEntities.map((entity) => UserMapper.toDomain(entity));
  }

  async save(user: User): Promise<User> {
    const userEntity = UserMapper.toPersistence(user);
    const savedEntity = await this.userRepository.save(userEntity);
    return UserMapper.toDomain(savedEntity);
  }

  async update(user: User): Promise<User> {
    const userEntity = UserMapper.toPersistence(user);
    const updatedEntity = await this.userRepository.save(userEntity);
    return UserMapper.toDomain(updatedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  async count(): Promise<number> {
    return this.userRepository.count();
  }
}

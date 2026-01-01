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

  async findByRoles(roles: string[], skip = 0, take = 100): Promise<User[]> {
    // Buscar usuarios que tengan al menos uno de los roles especificados
    // Los roles están almacenados como JSON array en la columna roles
    // Usamos JSON_CONTAINS que es específico de MySQL/MariaDB
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true });

    // Construir condiciones OR para cada rol
    const roleConditions = roles
      .map((role, index) => `JSON_CONTAINS(user.roles, :role${index})`)
      .join(' OR ');

    const roleParams = roles.reduce((acc, role, index) => {
      acc[`role${index}`] = JSON.stringify(role);
      return acc;
    }, {} as Record<string, string>);

    queryBuilder.andWhere(`(${roleConditions})`, roleParams);

    const userEntities = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getMany();

    return userEntities.map((entity) => UserMapper.toDomain(entity));
  }

  async countByRoles(roles: string[]): Promise<number> {
    // Contar usuarios que tengan al menos uno de los roles especificados
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true });

    const roleConditions = roles
      .map((role, index) => `JSON_CONTAINS(user.roles, :role${index})`)
      .join(' OR ');

    const roleParams = roles.reduce((acc, role, index) => {
      acc[`role${index}`] = JSON.stringify(role);
      return acc;
    }, {} as Record<string, string>);

    queryBuilder.andWhere(`(${roleConditions})`, roleParams);

    return queryBuilder.getCount();
  }

  async findByPartnerIdAndRoles(
    partnerId: number,
    roles: string[],
    skip = 0,
    take = 100,
    includeInactive = true,
  ): Promise<User[]> {
    // Buscar usuarios que pertenezcan al partner y tengan al menos uno de los roles especificados
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.partnerId = :partnerId', { partnerId });

    // Solo filtrar por isActive si includeInactive es false
    if (!includeInactive) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: true });
    }

    // Construir condiciones OR para cada rol
    const roleConditions = roles
      .map((role, index) => `JSON_CONTAINS(user.roles, :role${index})`)
      .join(' OR ');

    const roleParams = roles.reduce((acc, role, index) => {
      acc[`role${index}`] = JSON.stringify(role);
      return acc;
    }, {} as Record<string, string>);

    queryBuilder.andWhere(`(${roleConditions})`, roleParams);

    const userEntities = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getMany();

    return userEntities.map((entity) => UserMapper.toDomain(entity));
  }

  async countByPartnerIdAndRoles(
    partnerId: number,
    roles: string[],
    includeInactive = true,
  ): Promise<number> {
    // Contar usuarios que pertenezcan al partner y tengan al menos uno de los roles especificados
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.partnerId = :partnerId', { partnerId });

    // Solo filtrar por isActive si includeInactive es false
    if (!includeInactive) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: true });
    }

    const roleConditions = roles
      .map((role, index) => `JSON_CONTAINS(user.roles, :role${index})`)
      .join(' OR ');

    const roleParams = roles.reduce((acc, role, index) => {
      acc[`role${index}`] = JSON.stringify(role);
      return acc;
    }, {} as Record<string, string>);

    queryBuilder.andWhere(`(${roleConditions})`, roleParams);

    return queryBuilder.getCount();
  }
}

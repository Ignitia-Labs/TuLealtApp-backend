import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository, User } from '@libs/domain';
import { UserEntity } from '@libs/infrastructure/entities/auth/user.entity';
import { UserRoleEntity } from '@libs/infrastructure/entities/auth/user-role.entity';
import { UserMapper } from '@libs/infrastructure/mappers/auth/user.mapper';

/**
 * Implementación del repositorio de usuarios usando TypeORM
 *
 * NOTA: Actualizado para usar tablas relacionales en lugar de JSON_CONTAINS.
 * Las relaciones (roles, profileData) se cargan con LEFT JOIN cuando es necesario.
 */
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
  ) {}

  async findById(id: number): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({
      where: { id },
      relations: ['rolesRelation', 'profileDataRelation'],
    });

    if (!userEntity) {
      return null;
    }

    return UserMapper.toDomain(userEntity);
  }

  async findByEmail(email: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({
      where: { email },
      relations: ['rolesRelation', 'profileDataRelation'],
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
      relations: ['rolesRelation', 'profileDataRelation'],
      order: {
        createdAt: 'DESC',
      },
    });

    return userEntities.map((entity) => UserMapper.toDomain(entity));
  }

  async save(user: User): Promise<User> {
    const entity = UserMapper.toPersistence(user);
    const savedEntity = await this.userRepository.save(entity);

    // Cargar relaciones después de guardar para el mapper
    const entityWithRelations = await this.userRepository.findOne({
      where: { id: savedEntity.id },
      relations: ['rolesRelation', 'profileDataRelation'],
    });

    return UserMapper.toDomain(entityWithRelations || savedEntity);
  }

  async update(user: User): Promise<User> {
    // Cargar el usuario existente con sus roles para poder eliminarlos
    const existingEntity = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['rolesRelation', 'profileDataRelation'],
    });

    if (!existingEntity) {
      throw new Error(`User with ID ${user.id} not found`);
    }

    // Eliminar roles existentes antes de insertar los nuevos
    if (existingEntity.rolesRelation && existingEntity.rolesRelation.length > 0) {
      await this.userRoleRepository.remove(existingEntity.rolesRelation);
    }

    // Convertir a entidad de persistencia (esto creará nuevos roles sin IDs)
    const entity = UserMapper.toPersistence(user);

    // Guardar el usuario con los nuevos roles
    const updatedEntity = await this.userRepository.save(entity);

    // Cargar relaciones después de actualizar para el mapper
    const entityWithRelations = await this.userRepository.findOne({
      where: { id: updatedEntity.id },
      relations: ['rolesRelation', 'profileDataRelation'],
    });

    return UserMapper.toDomain(entityWithRelations || updatedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  async count(): Promise<number> {
    return this.userRepository.count();
  }

  async findByRoles(roles: string[], skip = 0, take = 100): Promise<User[]> {
    // Buscar usuarios que tengan al menos uno de los roles especificados
    // Usamos JOIN con la tabla user_roles en lugar de JSON_CONTAINS
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.rolesRelation', 'userRole')
      .leftJoinAndSelect('user.profileDataRelation', 'profileData')
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere('userRole.role IN (:...roles)', { roles });

    const userEntities = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getMany();

    return userEntities.map((entity) => UserMapper.toDomain(entity));
  }

  async countByRoles(roles: string[]): Promise<number> {
    // Contar usuarios que tengan al menos uno de los roles especificados
    // Usamos JOIN con la tabla user_roles en lugar de JSON_CONTAINS
    return await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.rolesRelation', 'userRole')
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere('userRole.role IN (:...roles)', { roles })
      .getCount();
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
      .leftJoinAndSelect('user.rolesRelation', 'userRole')
      .leftJoinAndSelect('user.profileDataRelation', 'profileData')
      .where('user.partnerId = :partnerId', { partnerId });

    // Solo filtrar por isActive si includeInactive es false
    if (!includeInactive) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: true });
    }

    queryBuilder.andWhere('userRole.role IN (:...roles)', { roles });

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
      .innerJoin('user.rolesRelation', 'userRole')
      .where('user.partnerId = :partnerId', { partnerId });

    // Solo filtrar por isActive si includeInactive es false
    if (!includeInactive) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: true });
    }

    queryBuilder.andWhere('userRole.role IN (:...roles)', { roles });

    return queryBuilder.getCount();
  }
}

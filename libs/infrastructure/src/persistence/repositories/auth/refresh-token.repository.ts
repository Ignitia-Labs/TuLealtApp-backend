import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { IRefreshTokenRepository, RefreshToken } from '@libs/domain';
import { RefreshTokenEntity } from '@libs/infrastructure/entities/auth/refresh-token.entity';
import { RefreshTokenMapper } from '@libs/infrastructure/mappers/auth/refresh-token.mapper';

/**
 * Implementación del repositorio de refresh tokens usando TypeORM
 */
@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
  ) {}

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const entity = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
    });

    if (!entity) {
      return null;
    }

    return RefreshTokenMapper.toDomain(entity);
  }

  async findActiveByUserId(userId: number): Promise<RefreshToken[]> {
    const now = new Date();
    const entities = await this.refreshTokenRepository.find({
      where: {
        userId,
        isRevoked: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    // Filtrar los no expirados en memoria (más eficiente que en SQL para MariaDB)
    const activeEntities = entities.filter((entity) => entity.expiresAt > now);

    return RefreshTokenMapper.toDomainMany(activeEntities);
  }

  async findAllByUserId(userId: number): Promise<RefreshToken[]> {
    const entities = await this.refreshTokenRepository.find({
      where: { userId },
      order: {
        createdAt: 'DESC',
      },
    });

    return RefreshTokenMapper.toDomainMany(entities);
  }

  async save(refreshToken: RefreshToken): Promise<RefreshToken> {
    const entity = RefreshTokenMapper.toPersistence(refreshToken);
    const savedEntity = await this.refreshTokenRepository.save(entity);

    return RefreshTokenMapper.toDomain(savedEntity as RefreshTokenEntity);
  }

  async update(refreshToken: RefreshToken): Promise<RefreshToken> {
    if (!refreshToken.id || refreshToken.id === 0) {
      throw new Error('Cannot update RefreshToken without ID');
    }

    const entity = RefreshTokenMapper.toPersistence(refreshToken);
    await this.refreshTokenRepository.update(refreshToken.id, entity);

    const updatedEntity = await this.refreshTokenRepository.findOne({
      where: { id: refreshToken.id },
    });

    if (!updatedEntity) {
      throw new Error(`RefreshToken with ID ${refreshToken.id} not found after update`);
    }

    return RefreshTokenMapper.toDomain(updatedEntity);
  }

  async revokeByTokenHash(tokenHash: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { tokenHash },
      {
        isRevoked: true,
        revokedAt: new Date(),
      },
    );
  }

  async revokeAllByUserId(userId: number): Promise<number> {
    const result = await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      {
        isRevoked: true,
        revokedAt: new Date(),
      },
    );

    return result.affected || 0;
  }

  async deleteExpired(): Promise<number> {
    const result = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    return result.affected || 0;
  }

  async countActiveByUserId(userId: number): Promise<number> {
    const now = new Date();
    
    // Contar tokens no revocados del usuario
    const tokens = await this.refreshTokenRepository.find({
      where: {
        userId,
        isRevoked: false,
      },
      select: ['expiresAt'],
    });

    // Filtrar los no expirados
    return tokens.filter((token) => token.expiresAt > now).length;
  }

  async deleteOldestIfExceedsLimit(userId: number, maxTokens: number): Promise<number> {
    // Obtener todos los tokens activos del usuario
    const activeTokens = await this.findActiveByUserId(userId);

    if (activeTokens.length <= maxTokens) {
      return 0; // No excede el límite
    }

    // Calcular cuántos tokens eliminar
    const tokensToDelete = activeTokens.length - maxTokens;

    // Ordenar por fecha de creación (más antiguos primero)
    const sortedTokens = activeTokens.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    // Tomar los más antiguos
    const oldestTokens = sortedTokens.slice(0, tokensToDelete);

    // Eliminar los tokens más antiguos
    const idsToDelete = oldestTokens.map((token) => token.id);
    
    if (idsToDelete.length > 0) {
      const result = await this.refreshTokenRepository.delete(idsToDelete);
      return result.affected || 0;
    }

    return 0;
  }
}

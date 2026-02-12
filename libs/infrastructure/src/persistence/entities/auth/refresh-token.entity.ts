import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

/**
 * Entidad de persistencia para RefreshToken
 * Mapea la entidad de dominio RefreshToken a la tabla de base de datos
 */
@Entity('refresh_tokens')
@Index('IDX_REFRESH_TOKENS_TOKEN_HASH', ['tokenHash'], { unique: true })
@Index('IDX_REFRESH_TOKENS_USER_ID', ['userId'])
@Index('IDX_REFRESH_TOKENS_EXPIRES_AT', ['expiresAt'])
@Index('IDX_REFRESH_TOKENS_IS_REVOKED', ['isRevoked'])
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  userId: number;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('varchar', { length: 255, unique: true })
  tokenHash: string;

  @Column('timestamp')
  expiresAt: Date;

  @Column('boolean', { default: false })
  isRevoked: boolean;

  @Column('varchar', { length: 500, nullable: true })
  userAgent: string | null;

  @Column('varchar', { length: 45, nullable: true })
  ipAddress: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column('timestamp', { nullable: true })
  revokedAt: Date | null;
}

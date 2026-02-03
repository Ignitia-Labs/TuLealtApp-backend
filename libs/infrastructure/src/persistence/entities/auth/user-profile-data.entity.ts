import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { UserEntity } from '@libs/infrastructure/entities/auth/user.entity';

/**
 * Entidad de persistencia para UserProfileData
 * Representa un dato adicional del perfil de usuario almacenado como clave-valor
 *
 * NOTA: Como el profile original es Record<string, any>, almacenamos los datos
 * como clave-valor. Para valores complejos, se serializan como JSON en el campo value.
 */
@Entity('user_profile_data')
@Index('IDX_USER_PROFILE_DATA_USER_ID', ['userId'])
@Index('IDX_USER_PROFILE_DATA_KEY', ['key'])
@Index('UK_USER_PROFILE_DATA_USER_KEY', ['userId', 'key'], { unique: true })
export class UserProfileDataEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, (user) => user.profileDataRelation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column('int', { name: 'user_id' })
  userId: number;

  @Column('varchar', { length: 100 })
  key: string; // ej: 'preferences.language', 'preferences.theme', etc.

  @Column('text', { nullable: true })
  value: string | null; // Valor serializado como JSON si es complejo, o texto plano
}

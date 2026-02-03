import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CustomerMembershipEntity } from '@libs/infrastructure/entities/customer/customer-membership.entity';
import { CustomerTierEntity } from '@libs/infrastructure/entities/customer/customer-tier.entity';

/**
 * Entidad de persistencia para TierStatus
 */
@Entity('tier_status')
export class TierStatusEntity {
  @PrimaryColumn('int')
  membershipId: number;

  @ManyToOne(() => CustomerMembershipEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'membershipId' })
  membership: CustomerMembershipEntity;

  @ManyToOne(() => CustomerTierEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'currentTierId' })
  currentTier: CustomerTierEntity | null;

  @Column('int', { nullable: true })
  currentTierId: number | null;

  @Column('datetime')
  since: Date;

  @Column('datetime', { nullable: true })
  graceUntil: Date | null;

  @Column('datetime', { nullable: true })
  nextEvalAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

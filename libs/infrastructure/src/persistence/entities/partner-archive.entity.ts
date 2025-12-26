import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

/**
 * Entidad de persistencia para PartnerArchive
 * Almacena partners eliminados con toda su información relacionada en formato JSON
 * Esta tabla puede tener datos JSON ya que solo es para archivo/historial
 */
@Entity('partner_archives')
export class PartnerArchiveEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  originalPartnerId: number;

  @Column('json', { comment: 'Datos completos del partner y todas sus relaciones en formato JSON' })
  archivedData: {
    partner: Record<string, any>;
    subscription: Record<string, any> | null;
    limits: Record<string, any> | null;
    stats: Record<string, any> | null;
    tenants: Array<{
      tenant: Record<string, any>;
      features: Record<string, any> | null;
      branches: Array<Record<string, any>>;
    }>;
    deletedAt: string;
    deletedBy?: number | null;
  };

  @Column('int', { nullable: true })
  deletedBy?: number | null;

  @CreateDateColumn()
  archivedAt: Date;
}

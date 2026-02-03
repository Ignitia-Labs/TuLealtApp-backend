import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerArchiveEntity } from '@libs/infrastructure/entities/partner/partner-archive.entity';

/**
 * Repositorio para PartnerArchive
 * Maneja el almacenamiento de partners archivados
 */
@Injectable()
export class PartnerArchiveRepository {
  constructor(
    @InjectRepository(PartnerArchiveEntity)
    private readonly archiveRepository: Repository<PartnerArchiveEntity>,
  ) {}

  /**
   * Guarda un registro de archivo de partner
   */
  async save(archiveData: PartnerArchiveEntity): Promise<PartnerArchiveEntity> {
    return this.archiveRepository.save(archiveData);
  }

  /**
   * Busca un archivo por el ID original del partner
   */
  async findByOriginalPartnerId(originalPartnerId: number): Promise<PartnerArchiveEntity | null> {
    return this.archiveRepository.findOne({
      where: { originalPartnerId },
      order: { archivedAt: 'DESC' },
    });
  }

  /**
   * Obtiene todos los archivos
   */
  async findAll(): Promise<PartnerArchiveEntity[]> {
    return this.archiveRepository.find({
      order: { archivedAt: 'DESC' },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPartnerRequestRepository, PartnerRequest } from '@libs/domain';
import { PartnerRequestEntity } from '../entities/partner-request.entity';
import { PartnerRequestMapper } from '../mappers/partner-request.mapper';

/**
 * Implementación del repositorio de PartnerRequest usando TypeORM
 */
@Injectable()
export class PartnerRequestRepository implements IPartnerRequestRepository {
  constructor(
    @InjectRepository(PartnerRequestEntity)
    private readonly partnerRequestRepository: Repository<PartnerRequestEntity>,
  ) {}

  async findById(id: number): Promise<PartnerRequest | null> {
    const entity = await this.partnerRequestRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return PartnerRequestMapper.toDomain(entity);
  }

  async findAll(skip = 0, take = 100): Promise<PartnerRequest[]> {
    const entities = await this.partnerRequestRepository.find({
      skip,
      take,
      order: { submittedAt: 'DESC' },
    });

    return entities.map((entity) => PartnerRequestMapper.toDomain(entity));
  }

  async findByStatus(
    status: 'pending' | 'in-progress' | 'enrolled' | 'rejected',
  ): Promise<PartnerRequest[]> {
    const entities = await this.partnerRequestRepository.find({
      where: { status },
      order: { submittedAt: 'DESC' },
    });

    return entities.map((entity) => PartnerRequestMapper.toDomain(entity));
  }

  async findPending(): Promise<PartnerRequest[]> {
    const entities = await this.partnerRequestRepository.find({
      where: { status: 'pending' },
      order: { submittedAt: 'ASC' },
    });

    return entities.map((entity) => PartnerRequestMapper.toDomain(entity));
  }

  async save(request: PartnerRequest): Promise<PartnerRequest> {
    const entity = PartnerRequestMapper.toPersistence(request);
    const savedEntity = await this.partnerRequestRepository.save(entity);
    return PartnerRequestMapper.toDomain(savedEntity);
  }

  async update(request: PartnerRequest): Promise<PartnerRequest> {
    const entity = PartnerRequestMapper.toPersistence(request);
    const updatedEntity = await this.partnerRequestRepository.save(entity);
    return PartnerRequestMapper.toDomain(updatedEntity);
  }
}

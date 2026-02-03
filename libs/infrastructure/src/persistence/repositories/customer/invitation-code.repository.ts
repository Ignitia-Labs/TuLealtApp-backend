import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IInvitationCodeRepository, InvitationCode } from '@libs/domain';
import { InvitationCodeEntity } from '@libs/infrastructure/entities/customer/invitation-code.entity';
import { InvitationCodeMapper } from '@libs/infrastructure/mappers/customer/invitation-code.mapper';

/**
 * Implementación del repositorio de InvitationCode usando TypeORM
 */
@Injectable()
export class InvitationCodeRepository implements IInvitationCodeRepository {
  constructor(
    @InjectRepository(InvitationCodeEntity)
    private readonly invitationCodeRepository: Repository<InvitationCodeEntity>,
  ) {}

  async findById(id: number): Promise<InvitationCode | null> {
    const entity = await this.invitationCodeRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return InvitationCodeMapper.toDomain(entity);
  }

  async findByCode(code: string): Promise<InvitationCode | null> {
    const entity = await this.invitationCodeRepository.findOne({
      where: { code },
    });

    if (!entity) {
      return null;
    }

    return InvitationCodeMapper.toDomain(entity);
  }

  async findByTenantId(tenantId: number): Promise<InvitationCode[]> {
    const entities = await this.invitationCodeRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => InvitationCodeMapper.toDomain(entity));
  }

  async findActiveByTenantId(tenantId: number): Promise<InvitationCode[]> {
    const entities = await this.invitationCodeRepository.find({
      where: { tenantId, status: 'active' },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => InvitationCodeMapper.toDomain(entity));
  }

  async save(code: InvitationCode): Promise<InvitationCode> {
    const entity = InvitationCodeMapper.toPersistence(code);
    const savedEntity = await this.invitationCodeRepository.save(entity);
    return InvitationCodeMapper.toDomain(savedEntity);
  }

  async update(code: InvitationCode): Promise<InvitationCode> {
    const entity = InvitationCodeMapper.toPersistence(code);
    const updatedEntity = await this.invitationCodeRepository.save(entity);
    return InvitationCodeMapper.toDomain(updatedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.invitationCodeRepository.delete(id);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBranchRepository, Branch } from '@libs/domain';
import { BranchEntity } from '../entities/branch.entity';
import { BranchMapper } from '../mappers/branch.mapper';

/**
 * Implementación del repositorio de branches usando TypeORM
 */
@Injectable()
export class BranchRepository implements IBranchRepository {
  constructor(
    @InjectRepository(BranchEntity)
    private readonly branchRepository: Repository<BranchEntity>,
  ) {}

  async save(branch: Branch): Promise<Branch> {
    const branchEntity = BranchMapper.toPersistence(branch);
    const savedEntity = await this.branchRepository.save(branchEntity);
    return BranchMapper.toDomain(savedEntity);
  }

  async update(branch: Branch): Promise<Branch> {
    const branchEntity = BranchMapper.toPersistence(branch);
    const updatedEntity = await this.branchRepository.save(branchEntity);
    return BranchMapper.toDomain(updatedEntity);
  }

  async findById(id: number): Promise<Branch | null> {
    const branchEntity = await this.branchRepository.findOne({
      where: { id },
    });

    if (!branchEntity) {
      return null;
    }

    return BranchMapper.toDomain(branchEntity);
  }

  async findByTenantId(tenantId: number): Promise<Branch[]> {
    const branchEntities = await this.branchRepository.find({
      where: { tenantId },
      order: {
        createdAt: 'DESC',
      },
    });

    return branchEntities.map((entity) => BranchMapper.toDomain(entity));
  }

  async findAll(): Promise<Branch[]> {
    const branchEntities = await this.branchRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    return branchEntities.map((entity) => BranchMapper.toDomain(entity));
  }

  async delete(id: number): Promise<void> {
    await this.branchRepository.delete(id);
  }
}

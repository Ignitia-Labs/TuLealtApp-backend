import { ApiProperty } from '@nestjs/swagger';
import { RewardRule } from '@libs/domain';

export class UpdateRewardRuleResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Recompensa por Visita Diaria Actualizada' })
  name: string;

  @ApiProperty({ example: 'inactive', enum: ['active', 'inactive', 'draft'] })
  status: string;

  @ApiProperty({ example: '2025-01-29T10:00:00Z' })
  updatedAt: Date;

  constructor(rule: RewardRule) {
    this.id = rule.id;
    this.name = rule.name;
    this.status = rule.status;
    this.updatedAt = rule.updatedAt;
  }
}

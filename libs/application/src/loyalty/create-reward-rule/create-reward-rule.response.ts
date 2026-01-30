import { ApiProperty } from '@nestjs/swagger';
import { RewardRule } from '@libs/domain';

export class CreateRewardRuleResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  programId: number;

  @ApiProperty({ example: 'Recompensa por Visita Diaria' })
  name: string;

  @ApiProperty({
    example: 'VISIT',
    enum: ['VISIT', 'PURCHASE', 'REFERRAL', 'SUBSCRIPTION', 'RETENTION', 'CUSTOM'],
  })
  trigger: string;

  @ApiProperty({ example: 'draft', enum: ['active', 'inactive', 'draft'] })
  status: string;

  @ApiProperty({ example: '2025-01-29T10:00:00Z' })
  createdAt: Date;

  constructor(rule: RewardRule) {
    this.id = rule.id;
    this.programId = rule.programId;
    this.name = rule.name;
    this.trigger = rule.trigger;
    this.status = rule.status;
    this.createdAt = rule.createdAt;
  }
}

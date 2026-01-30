import { ApiProperty } from '@nestjs/swagger';
import { PointsTransaction } from '@libs/domain';

export class ActivityItemDto {
  @ApiProperty({ example: 'transaction', enum: ['transaction', 'tier_change'] })
  type: string;

  @ApiProperty({ example: 'EARNING' })
  activityType: string;

  @ApiProperty({ example: 'Puntos otorgados por compra' })
  description: string;

  @ApiProperty({ example: 15, nullable: true })
  pointsDelta: number | null;

  @ApiProperty({ example: '2025-01-29T10:00:00Z' })
  occurredAt: Date;

  @ApiProperty({ example: { orderId: 'ORDER-001' }, nullable: true })
  metadata: Record<string, any> | null;
}

export class GetActivityResponse {
  @ApiProperty({ type: [ActivityItemDto] })
  activities: ActivityItemDto[];

  constructor(activities: ActivityItemDto[]) {
    this.activities = activities;
  }
}

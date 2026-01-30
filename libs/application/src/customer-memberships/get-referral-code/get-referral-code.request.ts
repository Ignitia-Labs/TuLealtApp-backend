import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetReferralCodeRequest {
  @ApiProperty({ example: 100, description: 'ID de la membership' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  membershipId: number;
}

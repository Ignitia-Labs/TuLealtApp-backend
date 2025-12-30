import { IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetSubscriptionStatsCompareRequest {
  @ApiProperty({
    description: 'Fecha de inicio del período actual (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsString()
  currentStartDate: string;

  @ApiProperty({
    description: 'Fecha de fin del período actual (ISO 8601)',
    example: '2024-03-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsString()
  currentEndDate: string;

  @ApiProperty({
    description: 'Fecha de inicio del período anterior (ISO 8601)',
    example: '2023-10-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsString()
  previousStartDate: string;

  @ApiProperty({
    description: 'Fecha de fin del período anterior (ISO 8601)',
    example: '2023-12-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsString()
  previousEndDate: string;
}


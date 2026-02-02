import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Request DTO para desinscribirse de un programa
 */
export class UnenrollFromProgramRequest {
  @ApiProperty({
    description: 'ID de la membership',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  membershipId: number;

  @ApiProperty({
    description: 'ID del programa del cual desinscribirse',
    example: 2,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  programId: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class EnrollWithInvitationCodeRequest {
  @ApiProperty({
    description: 'Código de invitación',
    example: 'WELCOME2024',
  })
  @IsString()
  @IsNotEmpty()
  invitationCode: string;
}

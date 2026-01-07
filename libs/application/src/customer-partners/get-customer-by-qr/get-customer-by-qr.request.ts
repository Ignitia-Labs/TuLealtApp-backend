import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Request para buscar un customer por QR code
 */
export class GetCustomerByQrRequest {
  @ApiProperty({
    description: 'Código QR único del customer',
    example: 'QR-USER-10-TENANT-1-A3B5C7',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  qrCode: string;
}

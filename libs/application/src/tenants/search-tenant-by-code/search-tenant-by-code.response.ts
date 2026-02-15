import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO con información pública del tenant
 */
export class TenantPublicInfoDto {
  @ApiProperty({
    description: 'ID del tenant',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Nombre del tenant',
    example: 'Café Delicia',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Descripción del tenant',
    example: 'Cafetería gourmet con sabor artesanal',
    type: String,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Logo del tenant',
    example: 'https://ui-avatars.com/api/?name=Cafe+Delicia&background=ec4899&color=fff',
    type: String,
    nullable: true,
  })
  logo: string | null;

  @ApiProperty({
    description: 'Color primario',
    example: '#ec4899',
    type: String,
  })
  primaryColor: string;

  @ApiProperty({
    description: 'Color secundario',
    example: '#fbbf24',
    type: String,
  })
  secondaryColor: string;

  @ApiProperty({
    description: 'Categoría del tenant',
    example: 'Cafeterías',
    type: String,
  })
  category: string;
}

/**
 * DTO con información pública del programa de lealtad
 */
export class LoyaltyProgramPublicInfoDto {
  @ApiProperty({
    description: 'ID del programa',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Nombre del programa',
    example: 'Programa Base Café Delicia',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Descripción del programa',
    example: 'Acumula puntos por cada compra en nuestros productos',
    type: String,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Tipo de programa',
    example: 'BASE',
    enum: ['BASE', 'PROMO', 'PARTNER', 'SUBSCRIPTION', 'EXPERIMENTAL'],
    type: String,
  })
  programType: string;

  @ApiProperty({
    description: 'Fecha de inicio de vigencia',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
    nullable: true,
  })
  activeFrom: Date | null;

  @ApiProperty({
    description: 'Fecha de fin de vigencia',
    example: '2024-12-31T23:59:59.999Z',
    type: Date,
    nullable: true,
  })
  activeTo: Date | null;
}

/**
 * DTO de response para búsqueda de tenant por código
 */
export class SearchTenantByCodeResponse {
  @ApiProperty({
    description: 'Información pública del tenant',
    type: TenantPublicInfoDto,
  })
  tenant: TenantPublicInfoDto;

  @ApiProperty({
    description: 'Programas de lealtad activos del tenant',
    type: LoyaltyProgramPublicInfoDto,
    isArray: true,
  })
  programs: LoyaltyProgramPublicInfoDto[];
}

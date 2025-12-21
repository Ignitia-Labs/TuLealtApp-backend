import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para obtener un partner
 */
export class GetPartnerResponse {
  @ApiProperty({
    description: 'ID del partner',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Nombre del partner',
    example: 'Grupo Comercial ABC',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Nombre del responsable',
    example: 'María González',
    type: String,
  })
  responsibleName: string;

  @ApiProperty({
    description: 'Email del partner',
    example: 'maria@abc-comercial.com',
    type: String,
  })
  email: string;

  @ApiProperty({
    description: 'Teléfono del partner',
    example: '+502 2345-6789',
    type: String,
  })
  phone: string;

  @ApiProperty({
    description: 'País del partner',
    example: 'Guatemala',
    type: String,
  })
  country: string;

  @ApiProperty({
    description: 'Ciudad del partner',
    example: 'Ciudad de Guatemala',
    type: String,
  })
  city: string;

  @ApiProperty({
    description: 'Plan del partner',
    example: 'conecta',
    type: String,
  })
  plan: string;

  @ApiProperty({
    description: 'Logo del partner',
    example: 'https://ui-avatars.com/api/?name=Grupo+ABC&background=4f46e5&color=fff',
    type: String,
    nullable: true,
  })
  logo: string | null;

  @ApiProperty({
    description: 'Categoría del negocio',
    example: 'Retail',
    type: String,
  })
  category: string;

  @ApiProperty({
    description: 'Número de sucursales',
    example: 5,
    type: Number,
  })
  branchesNumber: number;

  @ApiProperty({
    description: 'Sitio web del partner',
    example: 'https://abc-comercial.com',
    type: String,
    nullable: true,
  })
  website: string | null;

  @ApiProperty({
    description: 'Redes sociales del partner',
    example: '@abccomercial',
    type: String,
    nullable: true,
  })
  socialMedia: string | null;

  @ApiProperty({
    description: 'Tipo de recompensa',
    example: 'Por monto de compra',
    type: String,
  })
  rewardType: string;

  @ApiProperty({
    description: 'ID de la moneda',
    example: 'currency-8',
    type: String,
  })
  currencyId: string;

  @ApiProperty({
    description: 'Razón social del negocio',
    example: 'Grupo Comercial ABC S.A. de C.V.',
    type: String,
  })
  businessName: string;

  @ApiProperty({
    description: 'Número de identificación fiscal',
    example: 'RFC-ABC-123456',
    type: String,
  })
  taxId: string;

  @ApiProperty({
    description: 'Dirección fiscal',
    example: 'Zona 10, Guatemala City, Guatemala',
    type: String,
  })
  fiscalAddress: string;

  @ApiProperty({
    description: 'Método de pago',
    example: 'Tarjeta de crédito',
    type: String,
  })
  paymentMethod: string;

  @ApiProperty({
    description: 'Email para facturación',
    example: 'facturacion@abc-comercial.com',
    type: String,
  })
  billingEmail: string;

  @ApiProperty({
    description: 'Dominio del partner',
    example: 'abc-comercial.com',
    type: String,
  })
  domain: string;

  @ApiProperty({
    description: 'Estado del partner',
    example: 'active',
    type: String,
  })
  status: string;

  @ApiProperty({
    description: 'Fecha de creación del partner',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de actualización del partner',
    example: '2024-11-01T00:00:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(
    id: number,
    name: string,
    responsibleName: string,
    email: string,
    phone: string,
    country: string,
    city: string,
    plan: string,
    logo: string | null,
    category: string,
    branchesNumber: number,
    website: string | null,
    socialMedia: string | null,
    rewardType: string,
    currencyId: string,
    businessName: string,
    taxId: string,
    fiscalAddress: string,
    paymentMethod: string,
    billingEmail: string,
    domain: string,
    status: string,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.name = name;
    this.responsibleName = responsibleName;
    this.email = email;
    this.phone = phone;
    this.country = country;
    this.city = city;
    this.plan = plan;
    this.logo = logo;
    this.category = category;
    this.branchesNumber = branchesNumber;
    this.website = website;
    this.socialMedia = socialMedia;
    this.rewardType = rewardType;
    this.currencyId = currencyId;
    this.businessName = businessName;
    this.taxId = taxId;
    this.fiscalAddress = fiscalAddress;
    this.paymentMethod = paymentMethod;
    this.billingEmail = billingEmail;
    this.domain = domain;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

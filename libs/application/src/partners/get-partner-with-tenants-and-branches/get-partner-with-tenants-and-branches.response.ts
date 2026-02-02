import { ApiProperty } from '@nestjs/swagger';
import { GetTenantResponse } from '../../tenants/get-tenant/get-tenant.response';
import { GetBranchResponse } from '../../branches/get-branch/get-branch.response';
import { PartnerLimitsSwaggerDto } from '../dto/partner-limits-swagger.dto';

/**
 * DTO para el uso actual de la suscripción del partner
 */
export class PartnerUsageDto {
  @ApiProperty({
    description: 'Número de tenants actuales',
    example: 2,
    type: Number,
  })
  tenantsCount: number;

  @ApiProperty({
    description: 'Número de branches actuales',
    example: 8,
    type: Number,
  })
  branchesCount: number;

  @ApiProperty({
    description: 'Número de customers actuales',
    example: 2345,
    type: Number,
  })
  customersCount: number;

  @ApiProperty({
    description: 'Número de rewards actuales',
    example: 15,
    type: Number,
  })
  rewardsCount: number;

  @ApiProperty({
    description: 'Número total de programas de lealtad',
    example: 3,
    type: Number,
  })
  loyaltyProgramsCount: number;

  @ApiProperty({
    description: 'Número de programas de lealtad base',
    example: 1,
    type: Number,
  })
  loyaltyProgramsBaseCount: number;

  @ApiProperty({
    description: 'Número de programas de lealtad promocionales',
    example: 1,
    type: Number,
  })
  loyaltyProgramsPromoCount: number;

  @ApiProperty({
    description: 'Número de programas de lealtad de partner',
    example: 0,
    type: Number,
  })
  loyaltyProgramsPartnerCount: number;

  @ApiProperty({
    description: 'Número de programas de lealtad de suscripción',
    example: 1,
    type: Number,
  })
  loyaltyProgramsSubscriptionCount: number;

  @ApiProperty({
    description: 'Número de programas de lealtad experimentales',
    example: 0,
    type: Number,
  })
  loyaltyProgramsExperimentalCount: number;

  constructor(
    tenantsCount: number,
    branchesCount: number,
    customersCount: number,
    rewardsCount: number,
    loyaltyProgramsCount: number,
    loyaltyProgramsBaseCount: number,
    loyaltyProgramsPromoCount: number,
    loyaltyProgramsPartnerCount: number,
    loyaltyProgramsSubscriptionCount: number,
    loyaltyProgramsExperimentalCount: number,
  ) {
    this.tenantsCount = tenantsCount;
    this.branchesCount = branchesCount;
    this.customersCount = customersCount;
    this.rewardsCount = rewardsCount;
    this.loyaltyProgramsCount = loyaltyProgramsCount;
    this.loyaltyProgramsBaseCount = loyaltyProgramsBaseCount;
    this.loyaltyProgramsPromoCount = loyaltyProgramsPromoCount;
    this.loyaltyProgramsPartnerCount = loyaltyProgramsPartnerCount;
    this.loyaltyProgramsSubscriptionCount = loyaltyProgramsSubscriptionCount;
    this.loyaltyProgramsExperimentalCount = loyaltyProgramsExperimentalCount;
  }
}

/**
 * DTO de respuesta para un tenant con sus branches
 */
export class TenantWithBranchesDto {
  @ApiProperty({
    description: 'Información del tenant',
    type: GetTenantResponse,
  })
  tenant: GetTenantResponse;

  @ApiProperty({
    description: 'Lista de branches del tenant',
    type: GetBranchResponse,
    isArray: true,
  })
  branches: GetBranchResponse[];

  constructor(tenant: GetTenantResponse, branches: GetBranchResponse[]) {
    this.tenant = tenant;
    this.branches = branches;
  }
}

/**
 * DTO de response para obtener un partner con sus tenants y branches
 */
export class GetPartnerWithTenantsAndBranchesResponse {
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
    description: 'ID del país del partner',
    example: 1,
    type: Number,
    nullable: true,
  })
  countryId: number | null;

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
    description: 'Banner del partner',
    example: 'https://example.com/banners/partner-banner.jpg',
    type: String,
    nullable: true,
  })
  banner: string | null;

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
    description: 'ID de la moneda',
    example: 1,
    type: Number,
  })
  currencyId: number;

  @ApiProperty({
    description: 'Nombre comercial',
    example: 'Grupo Comercial ABC S.A.',
    type: String,
  })
  businessName: string;

  @ApiProperty({
    description: 'NIT o número de identificación fiscal',
    example: '12345678-9',
    type: String,
  })
  taxId: string;

  @ApiProperty({
    description: 'Dirección fiscal',
    example: 'Calle Principal 123, Zona 1, Ciudad de Guatemala',
    type: String,
  })
  fiscalAddress: string;

  @ApiProperty({
    description: 'Método de pago',
    example: 'credit_card',
    type: String,
  })
  paymentMethod: string;

  @ApiProperty({
    description: 'Email de facturación',
    example: 'billing@abc-comercial.com',
    type: String,
  })
  billingEmail: string;

  @ApiProperty({
    description: 'Dominio del partner',
    example: 'abc-comercial.gt',
    type: String,
  })
  domain: string;

  @ApiProperty({
    description: 'Estado del partner',
    example: 'active',
    enum: ['active', 'suspended', 'inactive'],
  })
  status: string;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-01-05T00:00:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de actualización',
    example: '2024-01-05T00:00:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Lista de tenants con sus branches',
    type: TenantWithBranchesDto,
    isArray: true,
  })
  tenants: TenantWithBranchesDto[];

  @ApiProperty({
    description: 'Límites del partner',
    type: PartnerLimitsSwaggerDto,
    nullable: true,
  })
  limits: PartnerLimitsSwaggerDto | null;

  @ApiProperty({
    description: 'Uso actual de la suscripción del partner',
    type: PartnerUsageDto,
    nullable: true,
  })
  usage: PartnerUsageDto | null;

  constructor(
    id: number,
    name: string,
    responsibleName: string,
    email: string,
    phone: string,
    countryId: number | null,
    city: string,
    plan: string,
    logo: string | null,
    banner: string | null,
    category: string,
    branchesNumber: number,
    website: string | null,
    socialMedia: string | null,
    currencyId: number,
    businessName: string,
    taxId: string,
    fiscalAddress: string,
    paymentMethod: string,
    billingEmail: string,
    domain: string,
    status: string,
    createdAt: Date,
    updatedAt: Date,
    tenants: TenantWithBranchesDto[],
    limits: PartnerLimitsSwaggerDto | null = null,
    usage: PartnerUsageDto | null = null,
  ) {
    this.id = id;
    this.name = name;
    this.responsibleName = responsibleName;
    this.email = email;
    this.phone = phone;
    this.countryId = countryId;
    this.city = city;
    this.plan = plan;
    this.logo = logo;
    this.banner = banner;
    this.category = category;
    this.branchesNumber = branchesNumber;
    this.website = website;
    this.socialMedia = socialMedia;
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
    this.tenants = tenants;
    this.limits = limits;
    this.usage = usage;
  }
}

import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para obtener una solicitud de partner
 */
export class GetPartnerRequestResponse {
  @ApiProperty({
    description: 'ID de la solicitud',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Estado de la solicitud',
    example: 'pending',
    enum: ['pending', 'in-progress', 'enrolled', 'rejected'],
  })
  status: string;

  @ApiProperty({
    description: 'Fecha de envío',
    example: '2024-11-14T09:30:00Z',
    type: String,
  })
  submittedAt: string;

  @ApiProperty({
    description: 'Nombre del partner',
    example: 'Restaurante La Cocina del Sol',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Nombre del responsable',
    example: 'Roberto Méndez',
    type: String,
  })
  responsibleName: string;

  @ApiProperty({
    description: 'Email',
    example: 'roberto@cocinasol.gt',
    type: String,
  })
  email: string;

  @ApiProperty({
    description: 'Teléfono',
    example: '+502 3333-4444',
    type: String,
  })
  phone: string;

  @ApiProperty({
    description: 'ID del país (referencia al catálogo de países)',
    example: 1,
    type: Number,
    nullable: true,
  })
  countryId: number | null;

  @ApiProperty({
    description: 'Ciudad',
    example: 'Antigua Guatemala',
    type: String,
  })
  city: string;

  @ApiProperty({
    description: 'Plan',
    example: 'conecta',
    type: String,
  })
  plan: string;

  @ApiProperty({
    description: 'Logo',
    example: 'https://ui-avatars.com/api/?name=Cocina+Sol&background=f97316&color=fff',
    type: String,
    nullable: true,
  })
  logo: string | null;

  @ApiProperty({
    description: 'Categoría',
    example: 'Restaurantes',
    type: String,
  })
  category: string;

  @ApiProperty({
    description: 'Número de sucursales',
    example: 3,
    type: Number,
  })
  branchesNumber: number;

  @ApiProperty({
    description: 'Sitio web',
    example: 'https://cocinasol.gt',
    type: String,
    nullable: true,
  })
  website: string | null;

  @ApiProperty({
    description: 'Redes sociales',
    example: '@cocinadelsolgt',
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
    description: 'ID de moneda',
    example: 'currency-8',
    type: String,
  })
  currencyId: string;

  @ApiProperty({
    description: 'Razón social',
    example: 'La Cocina del Sol S.A.',
    type: String,
  })
  businessName: string;

  @ApiProperty({
    description: 'Número de identificación fiscal',
    example: '12345678-9',
    type: String,
  })
  taxId: string;

  @ApiProperty({
    description: 'Dirección fiscal',
    example: '5ta Avenida Norte #10, Antigua Guatemala',
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
    description: 'Email de facturación',
    example: 'facturacion@cocinasol.gt',
    type: String,
  })
  billingEmail: string;

  @ApiProperty({
    description: 'Notas',
    example: 'Nueva solicitud pendiente de revisión',
    type: String,
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'ID del usuario asignado',
    example: 1,
    type: Number,
    nullable: true,
  })
  assignedTo: number | null;

  @ApiProperty({
    description: 'Última actualización',
    example: '2024-11-14T09:30:00Z',
    type: String,
  })
  lastUpdated: string;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-11-14T09:30:00Z',
    type: String,
  })
  createdAt: string;

  @ApiProperty({
    description: 'Fecha de actualización',
    example: '2024-11-14T09:30:00Z',
    type: String,
  })
  updatedAt: string;

  constructor(partnerRequest: any) {
    this.id = partnerRequest.id;
    this.status = partnerRequest.status;
    this.submittedAt = partnerRequest.submittedAt.toISOString();
    this.name = partnerRequest.name;
    this.responsibleName = partnerRequest.responsibleName;
    this.email = partnerRequest.email;
    this.phone = partnerRequest.phone;
    this.countryId = partnerRequest.countryId;
    this.city = partnerRequest.city;
    this.plan = partnerRequest.plan;
    this.logo = partnerRequest.logo;
    this.category = partnerRequest.category;
    this.branchesNumber = partnerRequest.branchesNumber;
    this.website = partnerRequest.website;
    this.socialMedia = partnerRequest.socialMedia;
    this.rewardType = partnerRequest.rewardType;
    this.currencyId = partnerRequest.currencyId;
    this.businessName = partnerRequest.businessName;
    this.taxId = partnerRequest.taxId;
    this.fiscalAddress = partnerRequest.fiscalAddress;
    this.paymentMethod = partnerRequest.paymentMethod;
    this.billingEmail = partnerRequest.billingEmail;
    this.notes = partnerRequest.notes;
    this.assignedTo = partnerRequest.assignedTo;
    this.lastUpdated = partnerRequest.lastUpdated.toISOString();
    this.createdAt = partnerRequest.createdAt?.toISOString() || new Date().toISOString();
    this.updatedAt = partnerRequest.updatedAt?.toISOString() || new Date().toISOString();
  }
}

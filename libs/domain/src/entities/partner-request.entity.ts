/**
 * Entidad de dominio PartnerRequest
 * Representa una solicitud de onboarding de un nuevo partner
 * No depende de frameworks ni librerías externas
 */
export type PartnerRequestStatus = 'pending' | 'in-progress' | 'enrolled' | 'rejected';

export class PartnerRequest {
  constructor(
    public readonly id: number,
    public readonly status: PartnerRequestStatus,
    public readonly submittedAt: Date,
    public readonly name: string,
    public readonly responsibleName: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly countryId: number | null,
    public readonly city: string,
    public readonly plan: string,
    public readonly logo: string | null,
    public readonly category: string,
    public readonly branchesNumber: number,
    public readonly website: string | null,
    public readonly socialMedia: string | null,
    public readonly rewardType: string,
    public readonly currencyId: string,
    public readonly businessName: string,
    public readonly taxId: string,
    public readonly fiscalAddress: string,
    public readonly paymentMethod: string,
    public readonly billingEmail: string,
    public readonly notes: string | null,
    public readonly assignedTo: number | null,
    public readonly lastUpdated: Date,
  ) {}

  /**
   * Factory method para crear una nueva solicitud de partner
   */
  static create(
    name: string,
    responsibleName: string,
    email: string,
    phone: string,
    countryId: number | null,
    city: string,
    plan: string,
    category: string,
    rewardType: string,
    currencyId: string,
    businessName: string,
    taxId: string,
    fiscalAddress: string,
    paymentMethod: string,
    billingEmail: string,
    branchesNumber: number = 0,
    logo: string | null = null,
    website: string | null = null,
    socialMedia: string | null = null,
    notes: string | null = null,
    status: PartnerRequestStatus = 'pending',
    assignedTo: number | null = null,
    submittedAt: Date = new Date(),
    id?: number,
  ): PartnerRequest {
    const now = new Date();
    return new PartnerRequest(
      id || 0,
      status,
      submittedAt,
      name,
      responsibleName,
      email,
      phone,
      countryId,
      city,
      plan,
      logo,
      category,
      branchesNumber,
      website,
      socialMedia,
      rewardType,
      currencyId,
      businessName,
      taxId,
      fiscalAddress,
      paymentMethod,
      billingEmail,
      notes,
      assignedTo,
      now,
    );
  }

  /**
   * Método de dominio para verificar si la solicitud está pendiente
   */
  isPending(): boolean {
    return this.status === 'pending';
  }

  /**
   * Método de dominio para marcar la solicitud como en progreso
   */
  markInProgress(assignedTo: number): PartnerRequest {
    return new PartnerRequest(
      this.id,
      'in-progress',
      this.submittedAt,
      this.name,
      this.responsibleName,
      this.email,
      this.phone,
      this.countryId,
      this.city,
      this.plan,
      this.logo,
      this.category,
      this.branchesNumber,
      this.website,
      this.socialMedia,
      this.rewardType,
      this.currencyId,
      this.businessName,
      this.taxId,
      this.fiscalAddress,
      this.paymentMethod,
      this.billingEmail,
      this.notes,
      assignedTo,
      new Date(),
    );
  }

  /**
   * Método de dominio para marcar la solicitud como inscrita
   */
  markEnrolled(): PartnerRequest {
    return new PartnerRequest(
      this.id,
      'enrolled',
      this.submittedAt,
      this.name,
      this.responsibleName,
      this.email,
      this.phone,
      this.countryId,
      this.city,
      this.plan,
      this.logo,
      this.category,
      this.branchesNumber,
      this.website,
      this.socialMedia,
      this.rewardType,
      this.currencyId,
      this.businessName,
      this.taxId,
      this.fiscalAddress,
      this.paymentMethod,
      this.billingEmail,
      this.notes,
      this.assignedTo,
      new Date(),
    );
  }

  /**
   * Método de dominio para rechazar la solicitud
   */
  reject(): PartnerRequest {
    return new PartnerRequest(
      this.id,
      'rejected',
      this.submittedAt,
      this.name,
      this.responsibleName,
      this.email,
      this.phone,
      this.countryId,
      this.city,
      this.plan,
      this.logo,
      this.category,
      this.branchesNumber,
      this.website,
      this.socialMedia,
      this.rewardType,
      this.currencyId,
      this.businessName,
      this.taxId,
      this.fiscalAddress,
      this.paymentMethod,
      this.billingEmail,
      this.notes,
      this.assignedTo,
      new Date(),
    );
  }

  /**
   * Método de dominio para agregar o actualizar notas
   */
  addNotes(notes: string): PartnerRequest {
    return new PartnerRequest(
      this.id,
      this.status,
      this.submittedAt,
      this.name,
      this.responsibleName,
      this.email,
      this.phone,
      this.countryId,
      this.city,
      this.plan,
      this.logo,
      this.category,
      this.branchesNumber,
      this.website,
      this.socialMedia,
      this.rewardType,
      this.currencyId,
      this.businessName,
      this.taxId,
      this.fiscalAddress,
      this.paymentMethod,
      this.billingEmail,
      notes,
      this.assignedTo,
      new Date(),
    );
  }
}


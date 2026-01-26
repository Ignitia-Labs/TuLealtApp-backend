/**
 * Entidad de dominio PartnerRequest
 * Representa una solicitud de onboarding de un nuevo partner
 * No depende de frameworks ni librerías externas
 */
import type { BillingFrequency } from './partner-subscription.entity';

export type PartnerRequestStatus = 'pending' | 'in-progress' | 'enrolled' | 'rejected';
export type PartnerRequestSource = 'public' | 'internal';

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
    public readonly planId: number | null,
    public readonly billingFrequency: BillingFrequency | null,
    public readonly logo: string | null,
    public readonly category: string,
    public readonly branchesNumber: number,
    public readonly website: string | null,
    public readonly socialMedia: string | null,
    public readonly rewardType: string,
    public readonly currencyId: number,
    public readonly subscriptionCurrencyId: number | null,
    public readonly trialDays: number | null,
    public readonly businessName: string,
    public readonly taxId: string,
    public readonly fiscalAddress: string,
    public readonly paymentMethod: string,
    public readonly billingEmail: string,
    public readonly notes: string | null,
    public readonly assignedTo: number | null,
    public readonly updatedBy: number | null,
    public readonly lastUpdated: Date,
    public readonly source: PartnerRequestSource,
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
    currencyId: number,
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
    planId: number | null = null,
    billingFrequency: BillingFrequency | null = null,
    subscriptionCurrencyId: number | null = null,
    trialDays: number | null = null,
    source: PartnerRequestSource = 'internal',
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
      planId,
      billingFrequency,
      logo,
      category,
      branchesNumber,
      website,
      socialMedia,
      rewardType,
      currencyId,
      subscriptionCurrencyId,
      trialDays,
      businessName,
      taxId,
      fiscalAddress,
      paymentMethod,
      billingEmail,
      notes,
      assignedTo,
      null, // updatedBy inicialmente null
      now,
      source,
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
   * Si assignedTo no se proporciona, mantiene el valor actual o lo deja como null
   */
  markInProgress(assignedTo?: number | null): PartnerRequest {
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
      this.planId,
      this.billingFrequency,
      this.logo,
      this.category,
      this.branchesNumber,
      this.website,
      this.socialMedia,
      this.rewardType,
      this.currencyId,
      this.subscriptionCurrencyId,
      this.trialDays,
      this.businessName,
      this.taxId,
      this.fiscalAddress,
      this.paymentMethod,
      this.billingEmail,
      this.notes,
      assignedTo !== undefined ? assignedTo : this.assignedTo,
      this.updatedBy,
      new Date(),
      this.source,
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
      this.planId,
      this.billingFrequency,
      this.logo,
      this.category,
      this.branchesNumber,
      this.website,
      this.socialMedia,
      this.rewardType,
      this.currencyId,
      this.subscriptionCurrencyId,
      this.trialDays,
      this.businessName,
      this.taxId,
      this.fiscalAddress,
      this.paymentMethod,
      this.billingEmail,
      this.notes,
      this.assignedTo,
      this.updatedBy,
      new Date(),
      this.source,
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
      this.planId,
      this.billingFrequency,
      this.logo,
      this.category,
      this.branchesNumber,
      this.website,
      this.socialMedia,
      this.rewardType,
      this.currencyId,
      this.subscriptionCurrencyId,
      this.trialDays,
      this.businessName,
      this.taxId,
      this.fiscalAddress,
      this.paymentMethod,
      this.billingEmail,
      this.notes,
      this.assignedTo,
      this.updatedBy,
      new Date(),
      this.source,
    );
  }

  /**
   * Método de dominio para marcar la solicitud como pendiente
   */
  markPending(): PartnerRequest {
    return new PartnerRequest(
      this.id,
      'pending',
      this.submittedAt,
      this.name,
      this.responsibleName,
      this.email,
      this.phone,
      this.countryId,
      this.city,
      this.plan,
      this.planId,
      this.billingFrequency,
      this.logo,
      this.category,
      this.branchesNumber,
      this.website,
      this.socialMedia,
      this.rewardType,
      this.currencyId,
      this.subscriptionCurrencyId,
      this.trialDays,
      this.businessName,
      this.taxId,
      this.fiscalAddress,
      this.paymentMethod,
      this.billingEmail,
      this.notes,
      this.assignedTo,
      this.updatedBy,
      new Date(),
      this.source,
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
      this.planId,
      this.billingFrequency,
      this.logo,
      this.category,
      this.branchesNumber,
      this.website,
      this.socialMedia,
      this.rewardType,
      this.currencyId,
      this.subscriptionCurrencyId,
      this.trialDays,
      this.businessName,
      this.taxId,
      this.fiscalAddress,
      this.paymentMethod,
      this.billingEmail,
      notes,
      this.assignedTo,
      this.updatedBy,
      new Date(),
      this.source,
    );
  }

  /**
   * Método de dominio para asignar o actualizar el usuario asignado
   */
  assignUser(userId: number): PartnerRequest {
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
      this.planId,
      this.billingFrequency,
      this.logo,
      this.category,
      this.branchesNumber,
      this.website,
      this.socialMedia,
      this.rewardType,
      this.currencyId,
      this.subscriptionCurrencyId,
      this.trialDays,
      this.businessName,
      this.taxId,
      this.fiscalAddress,
      this.paymentMethod,
      this.billingEmail,
      this.notes,
      userId,
      this.updatedBy,
      new Date(),
      this.source,
    );
  }

  /**
   * Método de dominio para actualizar campos de la solicitud
   */
  updateFields(
    updatedBy: number,
    fields: {
      name?: string;
      responsibleName?: string;
      email?: string;
      phone?: string;
      countryId?: number | null;
      city?: string;
      plan?: string;
      planId?: number | null;
      category?: string;
      website?: string | null;
      socialMedia?: string | null;
    },
  ): PartnerRequest {
    return new PartnerRequest(
      this.id,
      this.status,
      this.submittedAt,
      fields.name !== undefined ? fields.name : this.name,
      fields.responsibleName !== undefined ? fields.responsibleName : this.responsibleName,
      fields.email !== undefined ? fields.email : this.email,
      fields.phone !== undefined ? fields.phone : this.phone,
      fields.countryId !== undefined ? fields.countryId : this.countryId,
      fields.city !== undefined ? fields.city : this.city,
      fields.plan !== undefined ? fields.plan : this.plan,
      fields.planId !== undefined ? fields.planId : this.planId,
      this.billingFrequency,
      this.logo,
      fields.category !== undefined ? fields.category : this.category,
      this.branchesNumber,
      fields.website !== undefined ? fields.website : this.website,
      fields.socialMedia !== undefined ? fields.socialMedia : this.socialMedia,
      this.rewardType,
      this.currencyId,
      this.subscriptionCurrencyId,
      this.trialDays,
      this.businessName,
      this.taxId,
      this.fiscalAddress,
      this.paymentMethod,
      this.billingEmail,
      this.notes,
      this.assignedTo,
      updatedBy,
      new Date(),
      this.source,
    );
  }

  /**
   * Método de dominio para actualizar trialDays
   */
  updateTrialDays(trialDays: number | null, updatedBy: number | null): PartnerRequest {
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
      this.planId,
      this.billingFrequency,
      this.logo,
      this.category,
      this.branchesNumber,
      this.website,
      this.socialMedia,
      this.rewardType,
      this.currencyId,
      this.subscriptionCurrencyId,
      trialDays,
      this.businessName,
      this.taxId,
      this.fiscalAddress,
      this.paymentMethod,
      this.billingEmail,
      this.notes,
      this.assignedTo,
      updatedBy,
      new Date(),
      this.source,
    );
  }
}

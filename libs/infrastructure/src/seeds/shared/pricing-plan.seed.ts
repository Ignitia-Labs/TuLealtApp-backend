import { Injectable, Inject } from '@nestjs/common';
import { IPricingPlanRepository, PricingPlan, IRateExchangeRepository } from '@libs/domain';
import { BaseSeed } from '../base/base-seed';

/**
 * Seed para crear los planes de precios por defecto
 */
@Injectable()
export class PricingPlanSeed extends BaseSeed {
  constructor(
    @Inject('IPricingPlanRepository')
    private readonly pricingPlanRepository: IPricingPlanRepository,
    @Inject('IRateExchangeRepository')
    private readonly rateExchangeRepository: IRateExchangeRepository,
  ) {
    super();
  }

  getName(): string {
    return 'PricingPlanSeed';
  }

  async run(): Promise<void> {
    this.log('Iniciando seed de planes de precios...');

    try {
      await this.initializeRateExchange();

      // Plan 1: Esencia
      await this.createPlanIfNotExists('esencia', {
        name: 'Esencia',
        icon: '🟢',
        slug: 'esencia' as const,
        basePrice: 19,
        period: '/mes',
        pricing: {
          monthly: 19,
          quarterly: 54, // 5% descuento (19*3 = 57, 57*0.95 = 54.15)
          semiannual: 102, // 10% descuento (19*6 = 114, 114*0.90 = 102.6)
          annual: 182, // 20% descuento (19*12 = 228, 228*0.80 = 182.4)
        },
        promotions: {
          quarterly: {
            active: true,
            discountPercent: 5,
            label: '5% OFF - Ahorra pagando trimestral',
            validUntil: '2025-12-31T23:59:59Z',
          },
          semiannual: {
            active: true,
            discountPercent: 10,
            label: '10% OFF - Ahorra pagando semestral',
            validUntil: '2025-12-31T23:59:59Z',
          },
          annual: {
            active: true,
            discountPercent: 20,
            label: '20% OFF - Ahorra pagando anual',
            validUntil: '2025-12-31T23:59:59Z',
          },
        },
        description: 'Para quienes recién comienzan a fidelizar',
        features: [
          { id: 'f1', text: 'Clientes ilimitados', enabled: true },
          { id: 'f2', text: '1 sucursal', enabled: true },
          { id: 'f3', text: 'Tarjeta digital en tu web', enabled: true },
          { id: 'f4', text: 'Escaneo QR', enabled: true },
          { id: 'f5', text: 'Dashboard con métricas básicas', enabled: true },
          { id: 'f6', text: 'Recompensas ilimitadas', enabled: true },
          { id: 'f7', text: 'Soporte por chat y correo', enabled: true },
        ],
        cta: 'Comenzar Ahora',
        highlighted: false,
        status: 'active' as const,
        promotion: null,
        order: 1,
      });

      // Plan 2: Conecta
      await this.createPlanIfNotExists('conecta', {
        name: 'Conecta',
        icon: '🟣',
        slug: 'conecta' as const,
        basePrice: 49,
        period: '/mes',
        pricing: {
          monthly: 49,
          quarterly: 140, // 5% descuento (49*3 = 147, 147*0.95 = 139.65)
          semiannual: 265, // 10% descuento (49*6 = 294, 294*0.90 = 264.6)
          annual: 470, // 20% descuento (49*12 = 588, 588*0.80 = 470.4)
        },
        promotions: {
          monthly: {
            active: true,
            discountPercent: 20,
            label: '20% OFF - Oferta Lanzamiento',
            validUntil: '2025-12-31T23:59:59Z',
          },
          quarterly: {
            active: true,
            discountPercent: 25,
            label: '25% OFF - Lanzamiento + Trimestral',
            validUntil: '2025-12-31T23:59:59Z',
          },
          semiannual: {
            active: true,
            discountPercent: 30,
            label: '30% OFF - Lanzamiento + Semestral',
            validUntil: '2025-12-31T23:59:59Z',
          },
          annual: {
            active: true,
            discountPercent: 35,
            label: '35% OFF - Lanzamiento + Anual',
            validUntil: '2025-12-31T23:59:59Z',
          },
        },
        description: 'Para negocios que buscan comunidad',
        features: [
          { id: 'f8', text: 'Todo en Esencia', enabled: true },
          { id: 'f9', text: 'Hasta 5 sucursales', enabled: true },
          { id: 'f10', text: 'Integración con Google & Apple Wallet', enabled: true },
          { id: 'f11', text: 'Analytics avanzado (por segmento y recompensas)', enabled: true },
          { id: 'f12', text: 'Niveles VIP automáticos', enabled: true },
          { id: 'f13', text: 'Notificaciones push segmentadas', enabled: true },
          { id: 'f14', text: 'Reportes descargables', enabled: true },
          { id: 'f15', text: 'Soporte prioritario', enabled: true },
        ],
        cta: 'Comenzar Prueba',
        highlighted: true,
        status: 'active' as const,
        promotion: {
          active: true,
          discountPercent: 20,
          label: '20% OFF - Oferta Lanzamiento',
          validUntil: '2025-12-31T23:59:59Z',
        },
        order: 2,
      });

      // Plan 3: Inspira
      await this.createPlanIfNotExists('inspira', {
        name: 'Inspira',
        icon: '⚡',
        slug: 'inspira' as const,
        basePrice: null,
        period: '',
        pricing: {
          monthly: null,
          quarterly: null,
          semiannual: null,
          annual: null,
        },
        promotions: null,
        description: 'Para marcas que lideran y fidelizan en grande',
        features: [
          { id: 'f16', text: 'Todo en Conecta', enabled: true },
          { id: 'f17', text: 'Sucursales ilimitadas', enabled: true },
          { id: 'f18', text: 'API Access (con documentación)', enabled: true },
          { id: 'f19', text: 'White label (marca personalizada)', enabled: true },
          { id: 'f20', text: 'Multi-comercio y dashboard corporativo', enabled: true },
          { id: 'f21', text: 'Integración con CRM / ERP', enabled: true },
          { id: 'f22', text: 'Soporte 24/7 y Account Manager dedicado', enabled: true },
        ],
        cta: 'Contactar Ventas',
        highlighted: false,
        status: 'active' as const,
        promotion: null,
        order: 3,
      });

      this.log('Seeds de planes de precios completadas');
    } catch (error) {
      this.error('Error al crear planes de precios', error);
      throw error;
    }
  }

  private async createPlanIfNotExists(
    slug: string,
    planData: {
      name: string;
      icon: string;
      slug: string;
      basePrice: number | null;
      period: string;
      pricing: {
        monthly: number | null;
        quarterly: number | null;
        semiannual: number | null;
        annual: number | null;
      };
      promotions: {
        monthly?: {
          active: boolean;
          discountPercent: number;
          label: string;
          validUntil?: string;
        };
        quarterly?: {
          active: boolean;
          discountPercent: number;
          label: string;
          validUntil?: string;
        };
        semiannual?: {
          active: boolean;
          discountPercent: number;
          label: string;
          validUntil?: string;
        };
        annual?: {
          active: boolean;
          discountPercent: number;
          label: string;
          validUntil?: string;
        };
      } | null;
      description: string;
      features: Array<{ id: string; text: string; enabled: boolean }>;
      cta: string;
      highlighted: boolean;
      status: 'active' | 'inactive';
      promotion: {
        active: boolean;
        discountPercent: number;
        label: string;
        validUntil?: string;
      } | null;
      order: number;
    },
  ): Promise<void> {
    const existingPlan = await this.pricingPlanRepository.findBySlug(slug);

    if (existingPlan) {
      this.log(`Plan ${slug} ya existe con ID: ${existingPlan.id}`);
      return;
    }

    const plan = PricingPlan.create(
      planData.name,
      planData.icon,
      planData.slug,
      planData.basePrice,
      planData.period,
      planData.pricing,
      planData.promotions,
      planData.description,
      planData.features,
      planData.cta,
      planData.highlighted,
      planData.status,
      planData.promotion,
      planData.order,
    );

    const savedPlan = await this.pricingPlanRepository.save(plan);
    this.log(`Plan ${slug} creado exitosamente con ID: ${savedPlan.id}`);
  }

  private async initializeRateExchange(): Promise<void> {
    const currentRate = await this.rateExchangeRepository.getCurrent();

    if (currentRate) {
      this.log(`Tipo de cambio ya existe: ${currentRate.rate} GTQ por USD`);
      return;
    }

    const defaultRate = await this.rateExchangeRepository.setRate(8);
    this.log(`Tipo de cambio inicializado: ${defaultRate.rate} GTQ por USD`);
  }
}
